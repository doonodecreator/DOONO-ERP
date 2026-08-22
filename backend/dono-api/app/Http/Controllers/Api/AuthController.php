<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Staff;
use App\Models\User;
use App\Http\Resources\StaffResource;
use App\Services\CurrentContextService;
use App\Services\EmailVerificationService;
use App\Services\MediaStorageService;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private CurrentContextService $context,
        private EmailVerificationService $verification,
        private MediaStorageService $media,
    ) {
    }

    /**
     * Register a new proprietor + organization. Logs in automatically.
     * No school exists yet, so no role is assigned here — the Proprietor
     * role gets attached, scoped to the school, when the wizard runs
     * (see SchoolController@store).
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',

            'admin_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|confirmed|min:8',
        ]);

        $validated['email'] = strtolower(trim($validated['email']));

        try {
            $result = DB::transaction(function () use ($validated) {
                $user = User::create([
                    'name' => $validated['admin_name'],
                    'email' => $validated['email'],
                    'password' => $validated['password'],
                    'email_verified_at' => null,
                ]);

                $organization = Organization::create([
                    'owner_id' => $user->id,
                    'name' => $validated['name'],
                    'short_name' => $validated['code'] ?? null,
                    'registration_number' => null,
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                    'alternative_phone' => null,
                    'website' => null,
                    'logo' => null,
                    'country' => 'Nigeria',
                    'state' => 'Not Set',
                    'lga' => 'Not Set',
                    'address' => null,
                    'status' => 'active',
                ]);

                return [$user];
            });

            [$user] = $result;
            $verificationSent = $this->verification->send($user);

            return response()->json([
                'message' => 'Registration successful. Check your email to verify the account before signing in.',
                'verification_required' => true,
                'verification_email_sent' => $verificationSent,
                'email' => $user->email,
            ], 202);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Registration failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Unexpected server error.',
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $email = strtolower(trim((string) $request->input('email')));
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Verify your email address before signing in.',
                'code' => 'EMAIL_VERIFICATION_REQUIRED',
                'email' => $user->email,
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            ...$this->context->resolve($user),
        ]);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ]);

        $user = $request->user();
        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $validated['password'],
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Password changed successfully.',
            ...$this->context->resolve($user->fresh()),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * GET /api/me/context — the single endpoint the frontend trusts for
     * "what stage is this user at" and "what can this user do."
     */
    public function context(Request $request)
    {
        return response()->json($this->context->resolve($request->user()));
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_avatar' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('name', $validated)) {
            $user->name = $validated['name'];
        }

        if (($validated['remove_avatar'] ?? false) === true) {
            $this->media->delete($user->avatar);
            $user->avatar = null;
        } elseif ($request->hasFile('avatar')) {
            $user->avatar = $this->media->storeImage(
                $request->file('avatar'),
                'users/' . $user->id,
                $user->avatar,
            );
        }

        $user->save();

        ActivityLogService::log(
            module: 'profile',
            action: 'updated',
            description: "User profile updated for {$user->email}.",
            schoolId: $this->context->currentSchool($user)?->id,
            properties: ['name_changed' => array_key_exists('name', $validated), 'avatar_changed' => $request->hasFile('avatar') || ($validated['remove_avatar'] ?? false)],
        );

        return response()->json([
            'message' => 'Profile updated successfully.',
            ...$this->context->resolve($user->fresh()),
        ]);
    }

    /**
     * POST /api/me/switch-school — allows an Organization Owner or multi-school
     * user to explicitly select which school context they are currently managing.
     */
    public function staffProfile(Request $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        $staff = Staff::where('school_id', $schoolId)->where('user_id', $request->user()->id)->first();

        abort_unless($staff, 404, 'No staff profile is linked to this account in the active school.');

        return new StaffResource($staff->load('school'));
    }

    public function updateStaffProfile(Request $request)
    {
        $validated = $request->validate([
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'date_of_birth' => ['nullable', 'date'],
            'qualification' => ['nullable', 'string', 'max:255'],
        ]);

        $schoolId = $this->context->currentSchool($request->user())?->id;
        $staff = Staff::where('school_id', $schoolId)->where('user_id', $request->user()->id)->first();

        abort_unless($staff, 404, 'No staff profile is linked to this account in the active school.');
        $staff->update($validated);

        return new StaffResource($staff->fresh()->load('school'));
    }

    public function switchSchool(Request $request)
    {
        $request->validate([
            'school_id' => ['nullable', 'exists:schools,id'],
        ]);

        $user = $request->user();
        $schoolId = $request->school_id;

        if ($schoolId) {
            // Verify access before allowing the switch
            $isOwner = DB::table('schools')->where('id', $schoolId)->where('owner_id', $user->id)->exists();
            $hasRole = $user->roles()->wherePivot('school_id', $schoolId)->exists();

            if (!$isOwner && !$hasRole) {
                return response()->json([
                    'message' => 'You do not have access to this school.',
                ], 403);
            }
        }

        $user->update(['current_school_id' => $schoolId]);

        return response()->json([
            'message' => $schoolId ? 'School context switched.' : 'Switched to organization context.',
            ...$this->context->resolve($user),
        ]);
    }
}

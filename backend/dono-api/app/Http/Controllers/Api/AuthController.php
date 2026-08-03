<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private CurrentContextService $context)
    {
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

        try {
            $result = DB::transaction(function () use ($validated) {
                $user = User::create([
                    'name' => $validated['admin_name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
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

                $token = $user->createToken('api-token')->plainTextToken;

                return [$user, $token];
            });

            [$user, $token] = $result;

            return response()->json([
                'message' => 'Registration successful.',
                'token' => $token,
                ...$this->context->resolve($user),
            ], 201);

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

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            ...$this->context->resolve($user),
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
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new proprietor and organization.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            // Organization
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',

            // Owner
            'admin_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|confirmed|min:8',

            'role' => 'required|in:proprietor',
        ]);

        DB::beginTransaction();

        try {

            /*
            |--------------------------------------------------------------------------
            | Create User
            |--------------------------------------------------------------------------
            */

            $user = User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            /*
            |--------------------------------------------------------------------------
            | Assign Proprietor Role
            |--------------------------------------------------------------------------
            */

            $role = Role::where('slug', 'proprietor')->first();

            if ($role) {
                $user->roles()->sync([$role->id]);
            }

            /*
            |--------------------------------------------------------------------------
            | Create Organization
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | Generate Token
            |--------------------------------------------------------------------------
            */

            $token = $user->createToken('api-token')->plainTextToken;

            DB::commit();

            return response()->json([
                'message' => 'Registration successful.',
                'token' => $token,

                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'organization_id' => $organization->id,
                    'school_id' => null,
                ],

                'roles' => $user->roles()->get(),

                'permissions' => $user->roles()
                    ->with('permissions')
                    ->get()
                    ->flatMap(fn ($role) => $role->permissions)
                    ->pluck('slug')
                    ->unique()
                    ->values(),

                'organization' => $organization,
            ], 201);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'message' => 'Registration failed.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : 'Unexpected server error.',
            ], 500);
        }
    }

    /**
     * Login.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::with('roles.permissions')
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {

            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        $user->tokens()->delete();

        $token = $user->createToken('api-token')->plainTextToken;

        $organization = Organization::where('owner_id', $user->id)->first();

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'organization_id' => optional($organization)->id,
                'school_id' => optional($user->schools()->first())->id,
            ],

            'roles' => $user->roles,

            'permissions' => $user->roles
                ->flatMap(fn ($role) => $role->permissions)
                ->pluck('slug')
                ->unique()
                ->values(),

            'organization' => $organization,
        ]);
    }

    /**
     * Logout.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Current authenticated user.
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('roles.permissions');

        $organization = Organization::where('owner_id', $user->id)->first();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'organization_id' => optional($organization)->id,
                'school_id' => optional($user->schools()->first())->id,
            ],

            'roles' => $user->roles,

            'permissions' => $user->roles
                ->flatMap(fn ($role) => $role->permissions)
                ->pluck('slug')
                ->unique()
                ->values(),

            'organization' => $organization,
        ]);
    }
}

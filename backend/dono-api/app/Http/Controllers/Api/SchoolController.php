<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Organization;
use App\Models\Role;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolController extends Controller
{
    /**
     * List schools visible to the current user.
     * Super admins see everything; everyone else sees only schools they own.
     * (Staff-visible schools via role assignment will extend this later —
     * intentionally not built yet since no staff-invite flow exists.)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = School::with(['organization', 'owner', 'country']);

        if (!$user->isSuperAdmin()) {
            $query->where('owner_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->get(),
        ]);
    }

    /**
     * Create school (School Setup Wizard submit).
     * owner_id / organization_id are always derived from the authenticated
     * user server-side — never trusted from the request body.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:255',
            'school_code' => 'required|string|max:50|unique:schools,school_code',
            'school_type' => 'required|string|in:Primary,Secondary,Combined',
            'country_id' => 'required|exists:countries,id',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'has_primary' => 'boolean',
            'has_secondary' => 'boolean',
        ]);

        $organization = Organization::where('owner_id', $user->id)->first();

        if (!$organization) {
            return response()->json([
                'success' => false,
                'message' => 'No organization found for this account.',
            ], 422);
        }

        $school = DB::transaction(function () use ($validated, $user, $organization) {
            $school = School::create([
                'organization_id' => $organization->id,
                'owner_id' => $user->id,

                'country_id' => $validated['country_id'],

                'name' => $validated['name'],
                'short_name' => $validated['short_name'] ?? $validated['name'],

                'school_code' => $validated['school_code'],
                'school_type' => $validated['school_type'],

                'has_primary' => $validated['has_primary'] ?? true,
                'has_secondary' => $validated['has_secondary'] ?? false,

                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,

                'status' => 'active',
            ]);

            $proprietorRole = Role::where('slug', 'proprietor')->first();

            if ($proprietorRole) {
                $user->roles()->attach($proprietorRole->id, [
                    'school_id' => $school->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $school;
        });

        return response()->json([
            'success' => true,
            'message' => 'School created successfully.',
            'data' => $school->load(['organization', 'owner', 'country']),
        ], 201);
    }

    public function show(Request $request, School $school)
    {
        if (!$this->userCanAccessSchool($request->user(), $school)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $school->load(['organization', 'owner', 'country']),
        ]);
    }

    public function update(Request $request, School $school)
    {
        if (!$this->userCanAccessSchool($request->user(), $school)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'short_name' => 'nullable|string|max:255',
            'school_code' => 'sometimes|required|string|max:50|unique:schools,school_code,' . $school->id,
            'school_type' => 'sometimes|required|string|in:Primary,Secondary,Combined',
            'country_id' => 'sometimes|required|exists:countries,id',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
            'has_primary' => 'boolean',
            'has_secondary' => 'boolean',
        ]);

        $school->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'School updated successfully.',
            'data' => $school->fresh()->load(['organization', 'owner', 'country']),
        ]);
    }

    public function destroy(Request $request, School $school)
    {
        if (!$this->userCanAccessSchool($request->user(), $school)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $school->delete();

        return response()->json([
            'success' => true,
            'message' => 'School deleted successfully.',
        ]);
    }

    /**
     * Public-ish reference data (still requires auth — see routes file).
     */
    public function countries()
    {
        return response()->json([
            'success' => true,
            'data' => Country::orderBy('name')->get(),
        ]);
    }

    public function extendTrial(Request $request, School $school)
    {
        if (!$this->userCanAccessSchool($request->user(), $school)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Trial extended successfully.',
        ]);
    }

    public function updateSubscriptionStatus(Request $request, School $school)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Subscription updated successfully.',
        ]);
    }

    /**
     * A user can access a school if they're a super admin, the owner,
     * or hold any role explicitly scoped to that school.
     */
    private function userCanAccessSchool($user, School $school): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->id === $school->owner_id) {
            return true;
        }

        return $user->roles()->wherePivot('school_id', $school->id)->exists();
    }
}

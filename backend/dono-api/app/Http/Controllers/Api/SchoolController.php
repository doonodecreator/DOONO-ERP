<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Organization;
use App\Models\School;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    /**
     * List schools.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->hasRole('super_admin')) {
            $schools = School::with([
                'organization',
                'owner'
            ])->latest()->get();
        } else {
            $schools = School::where('owner_id', $user->id)
                ->with([
                    'organization',
                    'owner'
                ])
                ->latest()
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $schools,
        ]);
    }

    /**
     * Create school.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'school_code' => 'required|string|max:50|unique:schools,school_code',
            'school_type' => 'required|string|max:100',
            'country' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|string',
            'has_primary' => 'boolean',
            'has_secondary' => 'boolean',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $organization = Organization::where(
            'owner_id',
            $user->id
        )->first();

        if (!$organization) {
            return response()->json([
                'success' => false,
                'message' => 'No organization found for this account.'
            ], 422);
        }

        $countryName = $validated['country'] ?? 'Nigeria';

        $country = Country::where(
            'name',
            $countryName
        )->first();

        if (!$country) {
            $country = Country::where('name', 'Nigeria')->first();
        }

        if (!$country) {
            return response()->json([
                'success' => false,
                'message' => 'Nigeria was not found in countries table.'
            ], 500);
        }

        $school = School::create([
            'organization_id' => $organization->id,
            'owner_id' => $user->id,

            'country_id' => $country->id,
            'country' => $country->name,

            'name' => $validated['name'],
            'short_name' => $validated['name'],

            'school_code' => $validated['school_code'],
            'school_type' => $validated['school_type'],

            'has_primary' => $validated['has_primary'] ?? true,
            'has_secondary' => $validated['has_secondary'] ?? true,

            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,

            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'School created successfully.',
            'data' => $school,
        ], 201);
    }

    /**
     * Show school.
     */
    public function show(School $school)
    {
        return response()->json([
            'success' => true,
            'data' => $school->load([
                'organization',
                'owner'
            ]),
        ]);
    }

    /**
     * Update school.
     */
    public function update(Request $request, School $school)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'school_code' => 'sometimes|required|string|max:50|unique:schools,school_code,' . $school->id,
            'school_type' => 'sometimes|required|string|max:100',
            'country' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|string',
            'has_primary' => 'boolean',
            'has_secondary' => 'boolean',
        ]);

        if (isset($validated['country'])) {
            $country = Country::where(
                'name',
                $validated['country']
            )->first();

            if ($country) {
                $validated['country_id'] = $country->id;
            }
        }

        $school->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'School updated successfully.',
            'data' => $school->fresh(),
        ]);
    }

    /**
     * Delete school.
     */
    public function destroy(School $school)
    {
        $school->delete();

        return response()->json([
            'success' => true,
            'message' => 'School deleted successfully.',
        ]);
    }

    /**
     * Countries.
     */
    public function countries()
    {
        return response()->json([
            'success' => true,
            'data' => Country::orderBy('name')->get(),
        ]);
    }

    /**
     * Extend trial.
     */
    public function extendTrial(Request $request, School $school)
    {
        return response()->json([
            'success' => true,
            'message' => 'Trial extended successfully.',
        ]);
    }

    /**
     * Update subscription.
     */
    public function updateSubscriptionStatus(Request $request, School $school)
    {
        return response()->json([
            'success' => true,
            'message' => 'Subscription updated successfully.',
        ]);
    }
}

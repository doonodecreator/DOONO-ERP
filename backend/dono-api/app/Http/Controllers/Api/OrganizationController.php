<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * Display all organizations.
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Organization::with('owner')->latest()->get(),
        ]);
    }

    /**
     * Store a newly created organization.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'registration_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'alternative_phone' => 'nullable|string|max:30',
            'website' => 'nullable|string|max:255',
            'logo' => 'nullable|string|max:255',
            'country' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'lga' => 'required|string|max:100',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,suspended',
        ]);

        $validated['owner_id'] = auth()->id();

        $organization = Organization::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Organization created successfully.',
            'data' => $organization->load('owner'),
        ], 201);
    }

    /**
     * Display one organization.
     */
    public function show(Organization $organization)
    {
        return response()->json([
            'success' => true,
            'data' => $organization->load(['owner', 'schools']),
        ]);
    }

    /**
     * Update an organization.
     */
    public function update(Request $request, Organization $organization)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'registration_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'alternative_phone' => 'nullable|string|max:30',
            'website' => 'nullable|string|max:255',
            'logo' => 'nullable|string|max:255',
            'country' => 'sometimes|required|string|max:100',
            'state' => 'sometimes|required|string|max:100',
            'lga' => 'sometimes|required|string|max:100',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,suspended',
        ]);

        $organization->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Organization updated successfully.',
            'data' => $organization->fresh()->load('owner'),
        ]);
    }

    /**
     * Delete an organization.
     */
    public function destroy(Organization $organization)
    {
        $organization->delete();

        return response()->json([
            'success' => true,
            'message' => 'Organization deleted successfully.',
        ]);
    }
}

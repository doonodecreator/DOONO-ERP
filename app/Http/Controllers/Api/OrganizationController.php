<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrganizationRequest;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * Display all organizations.
     */
    public function index()
    {
        return OrganizationResource::collection(
            Organization::latest()->paginate(10)
        );
    }

    /**
     * Store a newly created organization.
     */
    public function store(StoreOrganizationRequest $request)
    {
        $organization = Organization::create($request->validated());

        return (new OrganizationResource($organization))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified organization.
     */
    public function show(Organization $organization)
    {
        return new OrganizationResource($organization);
    }

    /**
     * Update the specified organization.
     */
    public function update(Request $request, Organization $organization)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'registration_number' => 'nullable|string|max:100|unique:organizations,registration_number,' . $organization->id,
            'email' => 'nullable|email|max:255|unique:organizations,email,' . $organization->id,
            'phone' => 'nullable|string|max:20',
            'alternative_phone' => 'nullable|string|max:20',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|string|max:255',
            'country' => 'sometimes|required|string|max:100',
            'state' => 'sometimes|required|string|max:100',
            'lga' => 'sometimes|required|string|max:100',
            'address' => 'nullable|string',
            'status' => 'sometimes|required|in:active,inactive,suspended',
        ]);

        $organization->update($validated);

        return new OrganizationResource($organization);
    }

    /**
     * Remove the specified organization.
     */
    public function destroy(Organization $organization)
    {
        $organization->delete();

        return response()->json([
            'message' => 'Organization deleted successfully.'
        ]);
    }
}

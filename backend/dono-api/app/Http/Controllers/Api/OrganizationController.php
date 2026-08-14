<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrganizationRequest;
use App\Http\Requests\UpdateOrganizationRequest;
use App\Models\ActivityLog;
use App\Models\Organization;
use App\Services\CurrentContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Throwable;

class OrganizationController extends Controller
{
    public function __construct(private readonly CurrentContextService $context)
    {
    }

    private function assertCanManage(Request $request, Organization $organization): void
    {
        if (! $this->context->canManageOrganization($request->user(), $organization)) {
            abort(403, 'You may only manage organizations you own.');
        }
    }
    /**
     * Display a listing of organizations.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Organization::with(['owner'])
            ->withCount('schools');

        if (! $request->user()->isSuperAdmin()) {
            $query->where('owner_id', $request->user()->id);
        }

        if (request()->filled('search')) {
            $search = request('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('short_name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (request()->filled('status')) {
            $query->where('status', request('status'));
        }

        $organizations = $query
            ->latest()
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Organizations retrieved successfully.',
            'data' => $organizations,
        ]);
    }

    /**
     * Store a newly created organization.
     */
    public function store(StoreOrganizationRequest $request): JsonResponse
    {
        DB::beginTransaction();

        try {

            $organization = Organization::create([
                ...$request->validated(),
                'owner_id' => Auth::id(),
            ]);

            ActivityLog::create([
                'school_id' => null,
                'user_id' => Auth::id(),
                'is_platform_action' => true,
                'module' => 'Organization',
                'action' => 'CREATE',
                'description' => 'Created organization "' . $organization->name . '".',
                'subject_type' => Organization::class,
                'subject_id' => $organization->id,
                'properties' => [
                    'organization' => $organization->toArray(),
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Organization created successfully.',
                'data' => $organization->load('owner'),
            ], 201);

        } catch (Throwable $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create organization.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display the specified organization.
     */
    public function show(Request $request, Organization $organization): JsonResponse
    {
        $this->assertCanManage($request, $organization);

        $organization->load([
            'owner',
            'schools',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Organization retrieved successfully.',
            'data' => $organization,
        ]);
    }

    /**
     * Update the specified organization.
     */
    public function update(
        UpdateOrganizationRequest $request,
        Organization $organization
    ): JsonResponse {
        $this->assertCanManage($request, $organization);

        DB::beginTransaction();

        try {

            $oldData = $organization->toArray();

            $organization->update($request->validated());

            ActivityLog::create([
                'school_id' => null,
                'user_id' => Auth::id(),
                'is_platform_action' => true,
                'module' => 'Organization',
                'action' => 'UPDATE',
                'description' => 'Updated organization "' . $organization->name . '".',
                'subject_type' => Organization::class,
                'subject_id' => $organization->id,
                'properties' => [
                    'before' => $oldData,
                    'after' => $organization->fresh()->toArray(),
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Organization updated successfully.',
                'data' => $organization->fresh()->load('owner'),
            ]);

        } catch (Throwable $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update organization.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Remove the specified organization.
     */
    public function destroy(Request $request, Organization $organization): JsonResponse
    {
        $this->assertCanManage($request, $organization);

        if ($organization->schools()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This organization still owns one or more schools and cannot be deleted.',
            ], 422);
        }

        DB::beginTransaction();

        try {

            $deleted = $organization->toArray();

            ActivityLog::create([
                'school_id' => null,
                'user_id' => Auth::id(),
                'is_platform_action' => true,
                'module' => 'Organization',
                'action' => 'DELETE',
                'description' => 'Deleted organization "' . $organization->name . '".',
                'subject_type' => Organization::class,
                'subject_id' => $organization->id,
                'properties' => [
                    'deleted' => $deleted,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            $organization->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Organization deleted successfully.',
            ]);

        } catch (Throwable $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete organization.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}

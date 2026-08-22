<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSchoolFacilityRequest;
use App\Http\Requests\UpdateSchoolFacilityRequest;
use App\Http\Resources\SchoolFacilityResource;
use App\Models\SchoolFacility;
use App\Models\Staff;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class SchoolFacilityController extends Controller
{
    public function __construct(
        private CurrentContextService $context
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $query = SchoolFacility::with($this->resourceRelationships())
            ->where('school_id', $schoolId)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->input('status')))
            ->when($request->filled('category'), fn ($query) => $query->where('category', $request->input('category')))
            ->when($request->filled('condition'), fn ($query) => $query->where('condition', $request->input('condition')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->input('search'));
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('name');

        return SchoolFacilityResource::collection($query->paginate($this->perPage($request)));
    }

    public function options(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $search = trim((string) $request->input('search'));

        $staff = Staff::where('school_id', $schoolId)
            ->where('employment_status', 'Active')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('staff_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(50)
            ->get()
            ->map(fn (Staff $staffMember) => [
                'id' => $staffMember->id,
                'label' => "{$staffMember->full_name} ({$staffMember->staff_number})",
            ]);

        return response()->json(['data' => $staff->values()]);
    }

    public function store(StoreSchoolFacilityRequest $request)
    {
        $schoolId = $this->requireSchool($request);
        $facility = SchoolFacility::create([
            ...$request->validated(),
            'school_id' => $schoolId,
            'created_by' => $request->user()->id,
            'status' => 'Operational',
        ]);

        ActivityLogService::log(
            module: 'school_facilities',
            action: 'created',
            description: "Facility {$facility->name} registered.",
            subject: $facility,
            schoolId: $schoolId,
        );

        return (new SchoolFacilityResource($facility->load($this->resourceRelationships())))
            ->response()->setStatusCode(201);
    }

    public function show(Request $request, SchoolFacility $schoolFacility)
    {
        $this->ensureSchoolFacility($request, $schoolFacility);

        return new SchoolFacilityResource($schoolFacility->load($this->resourceRelationships()));
    }

    public function update(UpdateSchoolFacilityRequest $request, SchoolFacility $schoolFacility)
    {
        $schoolId = $this->ensureSchoolFacility($request, $schoolFacility);
        $data = $request->validated();
        $statusChanged = array_key_exists('status', $data) && $schoolFacility->status !== $data['status'];
        $schoolFacility->update($data);

        ActivityLogService::log(
            module: 'school_facilities',
            action: $statusChanged ? 'status_changed' : 'updated',
            description: $statusChanged
                ? "Facility {$schoolFacility->name} status changed to {$schoolFacility->status}."
                : "Facility {$schoolFacility->name} updated.",
            subject: $schoolFacility,
            schoolId: $schoolId,
        );

        return new SchoolFacilityResource($schoolFacility->load($this->resourceRelationships()));
    }

    private function ensureSchoolFacility(Request $request, SchoolFacility $schoolFacility): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless($schoolFacility->school_id === $schoolId, 403);

        return $schoolId;
    }


    private function resourceRelationships(): array
    {
        return ['school', 'responsibleStaff', 'creator'];
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 25), 1), 100);
    }
}

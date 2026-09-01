<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\TransportAllocation;
use App\Models\TransportRoute;
use App\Models\VehicleInspection;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class TransportAllocationController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(
            TransportAllocation::where('school_id', $schoolId)
                ->with(['route.vehicle', 'student'])
                ->latest()
                ->paginate(15)
        );
    }

    public function tracking(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $user = $request->user();

        $allocations = TransportAllocation::where('school_id', $schoolId)
            ->where('status', 'Active')
            ->whereHas('student', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('guardians', fn ($guardianQuery) => $guardianQuery->where('user_id', $user->id));
            })
            ->with(['route.vehicle', 'student'])
            ->latest()
            ->get();

        return response()->json(['data' => $allocations]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate([
            'transport_route_id' => 'required|exists:transport_routes,id',
            'student_id' => 'required|exists:students,id',
            'pickup_point' => 'nullable|string|max:255',
        ]);

        $route = TransportRoute::query()->whereKey($validated['transport_route_id'])->where('school_id', $schoolId)->with('vehicle')->first();
        abort_unless($route, 403, 'The selected route does not belong to this school.');
        $student = Student::query()->whereKey($validated['student_id'])->where('school_id', $schoolId)->whereRaw('LOWER(status) = ?', ['active'])->first();
        abort_unless($student, 422, 'Only an active student in the current school can be allocated to transport.');
        abort_unless(StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists(), 422, 'The student must have an active enrollment before transport can be assigned.');
        abort_if(TransportAllocation::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists(), 422, 'This student already has an active transport allocation.');
        abort_unless($route->vehicle, 422, 'Assign a vehicle to the route before allocating a student.');
        $vehicleStatus = strtolower(trim((string) ($route->vehicle->status ?? '')));
        abort_if(in_array($vehicleStatus, ['maintenance', 'inactive', 'retired'], true), 422, 'This route vehicle is not available for student transport.');
        $latestInspection = VehicleInspection::query()->where('school_id', $schoolId)->where('vehicle_id', $route->vehicle->id)->latest('inspection_date')->latest('id')->first();
        $inspectionCurrent = $latestInspection
            && $latestInspection->status === 'passed'
            && (! $latestInspection->next_due_date || ! $latestInspection->next_due_date->isPast());
        abort_unless($inspectionCurrent, 422, 'The route vehicle needs a current passed safety inspection before students can be allocated.');
        abort_if(TransportAllocation::query()->where('school_id', $schoolId)->where('transport_route_id', $route->id)->where('status', 'Active')->count() >= (int) $route->vehicle->capacity, 422, 'This route vehicle has reached its seating capacity.');

        $allocation = TransportAllocation::create([...$validated, 'school_id' => $schoolId, 'status' => 'Active']);
        ActivityLogService::log('transport', 'student_allocated', 'An active student was allocated to a safe transport route.', $allocation, ['student_id' => $student->id, 'transport_route_id' => $route->id, 'vehicle_id' => $route->vehicle->id], $schoolId);

        return response()->json(['message' => 'Student allocated to route successfully.', 'data' => $allocation->load(['route.vehicle', 'student'])], 201);
    }

}

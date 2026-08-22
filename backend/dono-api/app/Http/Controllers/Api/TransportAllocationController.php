<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\TransportAllocation;
use App\Models\TransportRoute;
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
            'student_id' => 'required|exists:students,id|unique:transport_allocations,student_id',
            'pickup_point' => 'nullable|string|max:255',
        ]);

        abort_unless(TransportRoute::whereKey($validated['transport_route_id'])->where('school_id', $schoolId)->exists(), 403, 'The selected route does not belong to this school.');
        abort_unless(Student::whereKey($validated['student_id'])->where('school_id', $schoolId)->exists(), 403, 'The selected student does not belong to this school.');

        $allocation = TransportAllocation::create([...$validated, 'school_id' => $schoolId]);
        return response()->json(['message' => 'Student allocated to route successfully.', 'data' => $allocation->load(['route.vehicle', 'student'])], 201);
    }

}

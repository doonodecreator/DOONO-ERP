<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use App\Models\Student;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class HostelAllocationController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(
            HostelAllocation::where('school_id', $schoolId)
                ->with(['room.hostel', 'student'])
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate([
            'hostel_room_id' => 'required|exists:hostel_rooms,id',
            'student_id' => 'required|exists:students,id',
            'bed_space' => 'nullable|string|max:50',
        ]);

        $room = HostelRoom::with('hostel')->whereKey($validated['hostel_room_id'])->whereHas('hostel', fn ($query) => $query->where('school_id', $schoolId))->firstOrFail();
        abort_unless(Student::whereKey($validated['student_id'])->where('school_id', $schoolId)->exists(), 403, 'The selected student does not belong to this school.');
        if ($room->occupied_beds >= $room->capacity) return response()->json(['message' => 'Selected room is at full capacity.'], 422);

        $validated['school_id'] = $schoolId;
        $validated['allocated_date'] = now()->toDateString();
        $validated['status'] = 'Active';

        $allocation = HostelAllocation::create($validated);
        $room->increment('occupied_beds');

        return response()->json(['message' => 'Student allocated to hostel room successfully.', 'data' => $allocation->load(['room.hostel', 'student'])], 201);
    }

}

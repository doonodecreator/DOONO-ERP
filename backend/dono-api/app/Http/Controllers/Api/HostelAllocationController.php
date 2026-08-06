<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use Illuminate\Http\Request;

class HostelAllocationController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;
        return response()->json(
            HostelAllocation::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
                ->with(['room.hostel', 'student'])
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hostel_room_id' => 'required|exists:hostel_rooms,id',
            'student_id' => 'required|exists:students,id',
            'bed_space' => 'nullable|string|max:50',
        ]);

        $room = HostelRoom::findOrFail($validated['hostel_room_id']);
        if ($room->occupied_beds >= $room->capacity) {
            return response()->json(['message' => 'Selected room is at full capacity.'], 422);
        }

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $validated['allocated_date'] = now()->toDateString();
        $validated['status'] = 'Active';

        $allocation = HostelAllocation::create($validated);
        $room->increment('occupied_beds');

        return response()->json(['message' => 'Student allocated to hostel room successfully.', 'data' => $allocation->load(['room.hostel', 'student'])], 201);
    }
}


<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hostel;
use App\Models\HostelRoom;
use Illuminate\Http\Request;

class HostelRoomController extends Controller
{
    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $validated = $request->validate([
            'hostel_id' => 'required|exists:hostels,id',
            'room_number' => 'required|string|max:50',
            'capacity' => 'required|integer|min:1',
        ]);

        abort_unless(
            Hostel::whereKey($validated['hostel_id'])->where('school_id', $schoolId)->exists(),
            422,
            'The selected hostel does not belong to the active school.'
        );

        $room = HostelRoom::create($validated + ['school_id' => $schoolId]);

        return response()->json([
            'message' => 'Room added successfully.',
            'data' => $room->load('hostel'),
        ], 201);
    }
}

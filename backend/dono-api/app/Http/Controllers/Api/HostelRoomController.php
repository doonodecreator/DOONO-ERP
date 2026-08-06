<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HostelRoom;
use Illuminate\Http\Request;

class HostelRoomController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'hostel_id' => 'required|exists:hostels,id',
            'room_number' => 'required|string|max:50',
            'capacity' => 'required|integer|min:1',
        ]);

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $room = HostelRoom::create($validated);
        return response()->json(['message' => 'Room added successfully.', 'data' => $room], 201);
    }
}


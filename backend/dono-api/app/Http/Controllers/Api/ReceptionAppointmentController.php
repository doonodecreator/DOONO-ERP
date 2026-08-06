<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReceptionAppointment;
use Illuminate\Http\Request;

class ReceptionAppointmentController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;
        return response()->json(
            ReceptionAppointment::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'visitor_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:50',
            'host_staff' => 'required|string|max:255',
            'appointment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $appointment = ReceptionAppointment::create($validated);
        return response()->json(['message' => 'Appointment scheduled successfully.', 'data' => $appointment], 201);
    }
}


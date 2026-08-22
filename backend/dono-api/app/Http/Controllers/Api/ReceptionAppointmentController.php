<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReceptionAppointment;
use Illuminate\Http\Request;

class ReceptionAppointmentController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        return response()->json(
            ReceptionAppointment::where('school_id', $schoolId)
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $validated = $request->validate([
            'visitor_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:50',
            'host_staff' => 'required|string|max:255',
            'appointment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $appointment = ReceptionAppointment::create($validated + ['school_id' => $schoolId]);

        return response()->json([
            'message' => 'Appointment scheduled successfully.',
            'data' => $appointment,
        ], 201);
    }
}

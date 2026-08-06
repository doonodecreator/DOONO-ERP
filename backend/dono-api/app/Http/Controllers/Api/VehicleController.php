<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;
        return response()->json(
            Vehicle::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_number' => 'required|string|max:50',
            'model' => 'nullable|string|max:255',
            'capacity' => 'required|integer|min:1',
            'driver_name' => 'nullable|string|max:255',
            'driver_phone' => 'nullable|string|max:50',
            'status' => 'required|in:Active,Maintenance,Inactive',
        ]);

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $vehicle = Vehicle::create($validated);
        return response()->json(['message' => 'Vehicle registered successfully.', 'data' => $vehicle], 201);
    }
}


<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return response()->json(
            Vehicle::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
            ->latest()
            ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_number' => 'required|string|max:50',
            'model' => 'required|string|max:100',
            'capacity' => 'required|integer|min:1',
            'driver_name' => 'required|string|max:255',
            'driver_phone' => 'required|string|max:50',
        ]);

        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        if ($schoolId) {
            $validated['school_id'] = $schoolId;
        }

        $vehicle = Vehicle::create($validated);

        return response()->json([
            'message' => 'Vehicle registered successfully.',
            'data' => $vehicle
        ], 201);
    }

    public function show(Vehicle $vehicle)
    {
        return response()->json($vehicle);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $validated = $request->validate([
            'vehicle_number' => 'sometimes|string|max:50',
            'model' => 'sometimes|string|max:100',
            'capacity' => 'sometimes|integer|min:1',
            'driver_name' => 'sometimes|string|max:255',
            'driver_phone' => 'sometimes|string|max:50',
        ]);

        $vehicle->update($validated);

        return response()->json([
            'message' => 'Vehicle updated successfully.',
            'data' => $vehicle
        ]);
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return response()->json([
            'message' => 'Vehicle deleted successfully.'
        ]);
    }
}

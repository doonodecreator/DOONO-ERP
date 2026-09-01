<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleInspection;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        return response()->json(
            Vehicle::where('school_id', $schoolId)
                ->latest()
                ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate([
            'vehicle_number' => 'required|string|max:50',
            'model' => 'nullable|string|max:100',
            'capacity' => 'required|integer|min:1',
            'driver_name' => 'nullable|string|max:255',
            'driver_phone' => 'nullable|string|max:50',
        ]);

        $vehicle = Vehicle::create([...$validated, 'school_id' => $schoolId]);
        ActivityLogService::log('transport', 'vehicle_created', 'A school transport vehicle was registered.', $vehicle, ['vehicle_number' => $vehicle->vehicle_number], $schoolId);

        return response()->json([
            'message' => 'Vehicle registered successfully.',
            'data' => $vehicle
        ], 201);
    }

    public function show(Request $request, Vehicle $vehicle)
    {
        $this->scoped($request, $vehicle);
        return response()->json($vehicle);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $schoolId = $this->scoped($request, $vehicle);
        $validated = $request->validate([
            'vehicle_number' => 'sometimes|string|max:50',
            'model' => 'sometimes|nullable|string|max:100',
            'capacity' => 'sometimes|integer|min:1',
            'driver_name' => 'sometimes|nullable|string|max:255',
            'driver_phone' => 'sometimes|nullable|string|max:50',
        ]);
        $before = $vehicle->only(array_keys($validated));
        $vehicle->update($validated);
        ActivityLogService::log('transport', 'vehicle_updated', 'A school transport vehicle was updated.', $vehicle, ['before' => $before, 'after' => $vehicle->fresh()->only(array_keys($validated))], $schoolId);

        return response()->json([
            'message' => 'Vehicle updated successfully.',
            'data' => $vehicle->fresh()
        ]);
    }

    public function destroy(Request $request, Vehicle $vehicle)
    {
        $schoolId = $this->scoped($request, $vehicle);
        abort_if($vehicle->routes()->exists() || VehicleInspection::where('vehicle_id', $vehicle->id)->exists(), 422, 'This vehicle has route or inspection history and cannot be deleted. Mark it inactive or place it in maintenance instead.');
        $vehicleNumber = $vehicle->vehicle_number;
        $vehicle->delete();
        ActivityLogService::log('transport', 'vehicle_deleted', 'An unused school transport vehicle was deleted.', null, ['vehicle_id' => $vehicle->id, 'vehicle_number' => $vehicleNumber], $schoolId);

        return response()->json([
            'message' => 'Vehicle deleted successfully.'
        ]);
    }

    private function scoped(Request $request, Vehicle $vehicle): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $vehicle->school_id === $schoolId, 404, 'Vehicle not found in the current school.');

        return $schoolId;
    }
}

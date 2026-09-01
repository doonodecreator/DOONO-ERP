<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleInspection;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class VehicleInspectionController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => VehicleInspection::query()->where('school_id', $schoolId)->when($request->integer('vehicle_id'), fn ($query, $vehicleId) => $query->where('vehicle_id', $vehicleId))->with(['vehicle:id,school_id,vehicle_number,model,status', 'inspectedBy:id,name'])->latest('inspection_date')->paginate(min(max($request->integer('per_page', 30), 1), 100))]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'inspection_date' => ['required', 'date'],
            'status' => ['required', 'in:passed,needs_attention,failed'],
            'odometer' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'next_due_date' => ['nullable', 'date', 'after_or_equal:inspection_date'],
        ]);
        $vehicle = Vehicle::query()->whereKey($validated['vehicle_id'])->where('school_id', $schoolId)->firstOrFail();
        $inspection = VehicleInspection::create([...$validated, 'school_id' => $schoolId, 'inspected_by' => $request->user()->id]);
        if ($inspection->status === 'failed') {
            $vehicle->update(['status' => 'Maintenance']);
        }
        ActivityLogService::log('transport', 'vehicle_inspection_created', 'A vehicle safety inspection was recorded.', $inspection, ['vehicle_id' => $vehicle->id, 'status' => $inspection->status], $schoolId);

        return response()->json(['message' => 'Vehicle inspection recorded successfully.', 'data' => $inspection->load(['vehicle', 'inspectedBy:id,name'])], 201);
    }

    public function show(Request $request, VehicleInspection $vehicleInspection)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $vehicleInspection->school_id === $schoolId, 404, 'Vehicle inspection not found.');
        return response()->json(['data' => $vehicleInspection->load(['vehicle', 'inspectedBy:id,name'])]);
    }

    public function update(Request $request, VehicleInspection $vehicleInspection)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $vehicleInspection->school_id === $schoolId, 404, 'Vehicle inspection not found.');
        $validated = $request->validate([
            'inspection_date' => ['sometimes', 'date'],
            'status' => ['sometimes', 'in:passed,needs_attention,failed'],
            'odometer' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'next_due_date' => ['nullable', 'date'],
        ]);
        $before = $vehicleInspection->only(['inspection_date', 'status', 'odometer', 'notes', 'next_due_date']);
        $vehicleInspection->update($validated);
        if (($validated['status'] ?? $vehicleInspection->status) === 'failed') {
            $vehicleInspection->vehicle()->update(['status' => 'Maintenance']);
        }
        ActivityLogService::log('transport', 'vehicle_inspection_updated', 'A vehicle inspection was updated.', $vehicleInspection, ['before' => $before, 'after' => $vehicleInspection->fresh()->only(array_keys($before))], $schoolId);

        return response()->json(['message' => 'Vehicle inspection updated successfully.', 'data' => $vehicleInspection->fresh()->load(['vehicle', 'inspectedBy:id,name'])]);
    }

    public function destroy(Request $request, VehicleInspection $vehicleInspection)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $vehicleInspection->school_id === $schoolId, 404, 'Vehicle inspection not found.');
        return response()->json(['message' => 'Inspection history is retained for transport safety accountability.'], 422);
    }
}

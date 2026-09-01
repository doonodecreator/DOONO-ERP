<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransportRoute;
use App\Models\Vehicle;
use App\Models\VehicleInspection;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class TransportRouteController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        return response()->json(
            TransportRoute::where('school_id', $schoolId)
                ->with(['vehicle'])
                ->latest()
                ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate([
            'route_name' => 'required|string|max:255',
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'description' => 'nullable|string|max:1000',
            'fare_amount' => 'required|numeric|min:0',
        ]);

        if (! empty($validated['vehicle_id'])) {
            abort_unless(Vehicle::whereKey($validated['vehicle_id'])->where('school_id', $schoolId)->exists(), 403, 'The selected vehicle does not belong to this school.');
        }
        $route = TransportRoute::create([...$validated, 'school_id' => $schoolId]);
        ActivityLogService::log('transport', 'route_created', 'A school transport route was created.', $route, ['route_name' => $route->route_name, 'vehicle_id' => $route->vehicle_id], $schoolId);

        return response()->json([
            'message' => 'Transport route created successfully.',
            'data' => $route->load(['vehicle'])
        ], 201);
    }

    public function show(Request $request, TransportRoute $transportRoute)
    {
        $this->ensureSchoolRoute($request, $transportRoute);
        return response()->json($transportRoute->load(['vehicle']));
    }

    public function update(Request $request, TransportRoute $transportRoute)
    {
        $schoolId = $this->ensureSchoolRoute($request, $transportRoute);
        $validated = $request->validate([
            'route_name' => 'sometimes|string|max:255',
            'vehicle_id' => 'sometimes|nullable|exists:vehicles,id',
            'description' => 'sometimes|nullable|string|max:1000',
            'fare_amount' => 'sometimes|numeric|min:0',
        ]);

        $activeAllocationCount = $transportRoute->allocations()->where('status', 'Active')->count();
        if (array_key_exists('vehicle_id', $validated)) {
            $newVehicle = ! empty($validated['vehicle_id'])
                ? Vehicle::whereKey($validated['vehicle_id'])->where('school_id', $schoolId)->first()
                : null;
            if (! empty($validated['vehicle_id'])) {
                abort_unless($newVehicle, 403, 'The selected vehicle does not belong to this school.');
            }
            if ($activeAllocationCount > 0) {
                abort_unless($newVehicle, 422, 'A route with active student allocations must keep a vehicle assigned.');
                $inspection = VehicleInspection::query()->where('school_id', $schoolId)->where('vehicle_id', $newVehicle->id)->latest('inspection_date')->latest('id')->first();
                $inspectionCurrent = $inspection
                    && $inspection->status === 'passed'
                    && (! $inspection->next_due_date || ! $inspection->next_due_date->isPast());
                abort_unless($inspectionCurrent, 422, 'The replacement route vehicle needs a current passed safety inspection.');
                abort_if(in_array(strtolower((string) $newVehicle->status), ['maintenance', 'inactive'], true), 422, 'The replacement route vehicle is not available.');
                abort_if($activeAllocationCount > (int) $newVehicle->capacity, 422, 'The replacement route vehicle does not have enough seats for current riders.');
            }
        }
        $before = $transportRoute->only(array_keys($validated));
        $transportRoute->update($validated);
        ActivityLogService::log('transport', 'route_updated', 'A school transport route was updated.', $transportRoute, ['before' => $before, 'after' => $transportRoute->fresh()->only(array_keys($validated))], $schoolId);

        return response()->json(['message' => 'Route updated successfully.', 'data' => $transportRoute->fresh()->load(['vehicle'])]);
    }

    public function destroy(Request $request, TransportRoute $transportRoute)
    {
        $schoolId = $this->ensureSchoolRoute($request, $transportRoute);
        abort_if($transportRoute->allocations()->where('status', 'Active')->exists(), 422, 'This route has active student allocations and cannot be deleted. Suspend or reassign those allocations first.');
        $routeName = $transportRoute->route_name;
        $transportRoute->delete();
        ActivityLogService::log('transport', 'route_deleted', 'An unused school transport route was deleted.', null, ['route_id' => $transportRoute->id, 'route_name' => $routeName], $schoolId);
        return response()->json(['message' => 'Transport route deleted successfully.']);
    }


    private function ensureSchoolRoute(Request $request, TransportRoute $transportRoute): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $transportRoute->school_id === $schoolId, 403);
        return $schoolId;
    }
}

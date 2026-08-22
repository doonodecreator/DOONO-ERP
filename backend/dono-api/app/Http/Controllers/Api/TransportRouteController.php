<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransportRoute;
use App\Models\Vehicle;
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
            'vehicle_id' => 'required|exists:vehicles,id',
            'description' => 'nullable|string|max:1000',
            'fare_amount' => 'required|numeric|min:0',
        ]);

        abort_unless(Vehicle::whereKey($validated['vehicle_id'])->where('school_id', $schoolId)->exists(), 403, 'The selected vehicle does not belong to this school.');
        $route = TransportRoute::create([...$validated, 'school_id' => $schoolId]);

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
            'vehicle_id' => 'sometimes|exists:vehicles,id',
            'description' => 'sometimes|nullable|string|max:1000',
            'fare_amount' => 'sometimes|numeric|min:0',
        ]);

        if (isset($validated['vehicle_id'])) {
            abort_unless(Vehicle::whereKey($validated['vehicle_id'])->where('school_id', $schoolId)->exists(), 403, 'The selected vehicle does not belong to this school.');
        }
        $transportRoute->update($validated);

        return response()->json(['message' => 'Route updated successfully.', 'data' => $transportRoute->load(['vehicle'])]);
    }

    public function destroy(Request $request, TransportRoute $transportRoute)
    {
        $this->ensureSchoolRoute($request, $transportRoute);
        $transportRoute->delete();
        return response()->json(['message' => 'Transport route deleted successfully.']);
    }


    private function ensureSchoolRoute(Request $request, TransportRoute $transportRoute): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $transportRoute->school_id === $schoolId, 403);
        return $schoolId;
    }
}

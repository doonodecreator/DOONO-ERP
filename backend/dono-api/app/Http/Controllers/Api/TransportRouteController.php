<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransportRoute;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class TransportRouteController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return response()->json(
            TransportRoute::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
            ->with(['vehicle'])
            ->latest()
            ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_name' => 'required|string|max:255',
            'vehicle_id' => 'required|exists:vehicles,id',
            'pickup_points' => 'required|string',
            'fare' => 'required|numeric|min:0',
        ]);

        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        if ($schoolId) {
            $validated['school_id'] = $schoolId;
        }

        $route = TransportRoute::create($validated);

        return response()->json([
            'message' => 'Transport route created successfully.',
            'data' => $route->load(['vehicle'])
        ], 201);
    }

    public function show(TransportRoute $transportRoute)
    {
        return response()->json($transportRoute->load(['vehicle']));
    }

    public function update(Request $request, TransportRoute $transportRoute)
    {
        $validated = $request->validate([
            'route_name' => 'sometimes|string|max:255',
            'vehicle_id' => 'sometimes|exists:vehicles,id',
            'pickup_points' => 'sometimes|string',
            'fare' => 'sometimes|numeric|min:0',
        ]);

        $transportRoute->update($validated);

        return response()->json([
            'message' => 'Route updated successfully.',
            'data' => $transportRoute->load(['vehicle'])
        ]);
    }

    public function destroy(TransportRoute $transportRoute)
    {
        $transportRoute->delete();

        return response()->json([
            'message' => 'Route deleted successfully.'
        ]);
    }
}

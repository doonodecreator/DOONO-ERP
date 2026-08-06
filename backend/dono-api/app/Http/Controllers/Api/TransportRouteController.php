<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransportRoute;
use Illuminate\Http\Request;

class TransportRouteController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;
        return response()->json(
            TransportRoute::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
                ->with(['vehicle', 'allocations'])
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'fare_amount' => 'required|numeric|min:0',
        ]);

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $route = TransportRoute::create($validated);
        return response()->json(['message' => 'Transport route created successfully.', 'data' => $route->load('vehicle')], 201);
    }
}


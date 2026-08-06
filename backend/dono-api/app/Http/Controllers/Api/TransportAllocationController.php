<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransportAllocation;
use Illuminate\Http\Request;

class TransportAllocationController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;
        return response()->json(
            TransportAllocation::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
                ->with(['route.vehicle', 'student'])
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'transport_route_id' => 'required|exists:transport_routes,id',
            'student_id' => 'required|exists:students,id|unique:transport_allocations,student_id',
            'pickup_point' => 'nullable|string|max:255',
        ]);

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $allocation = TransportAllocation::create($validated);
        return response()->json(['message' => 'Student allocated to route successfully.', 'data' => $allocation->load(['route.vehicle', 'student'])], 201);
    }
}


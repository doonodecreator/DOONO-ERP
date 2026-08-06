<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hostel;
use Illuminate\Http\Request;

class HostelController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;
        return response()->json(
            Hostel::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
                ->with(['rooms'])
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:Boys,Girls,Mixed',
            'description' => 'nullable|string',
        ]);

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $hostel = Hostel::create($validated);
        return response()->json(['message' => 'Hostel created successfully.', 'data' => $hostel], 201);
    }
}


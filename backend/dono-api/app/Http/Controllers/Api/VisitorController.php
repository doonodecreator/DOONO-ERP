<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use Illuminate\Http\Request;

class VisitorController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;
        return response()->json(
            Visitor::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'visitor_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:50',
            'to_see' => 'required|string|max:255',
            'purpose' => 'required|string',
        ]);

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $validated['check_in_time'] = now();
        $validated['status'] = 'Checked In';

        $visitor = Visitor::create($validated);
        return response()->json(['message' => 'Visitor checked in successfully.', 'data' => $visitor], 201);
    }

    public function update(Request $request, $id)
    {
        $visitor = Visitor::findOrFail($id);
        $visitor->update([
            'check_out_time' => now(),
            'status' => 'Checked Out'
        ]);
        return response()->json(['message' => 'Visitor checked out successfully.', 'data' => $visitor]);
    }
}


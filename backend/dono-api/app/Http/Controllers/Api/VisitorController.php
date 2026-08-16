<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class VisitorController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return response()->json(
            Visitor::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
            ->latest()
            ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'visitor_name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'whom_to_see' => 'required|string|max:255',
            'purpose' => 'required|string',
            'check_in_time' => 'nullable|date',
        ]);

        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        if ($schoolId) {
            $validated['school_id'] = $schoolId;
        }
        $validated['check_in_time'] = $validated['check_in_time'] ?? now();

        $visitor = Visitor::create($validated);

        return response()->json([
            'message' => 'Visitor checked in successfully.',
            'data' => $visitor
        ], 201);
    }

    public function show(Visitor $visitor)
    {
        return response()->json($visitor);
    }

    public function update(Request $request, Visitor $visitor)
    {
        $validated = $request->validate([
            'check_out_time' => 'nullable|date',
            'status' => 'sometimes|in:Checked In,Checked Out',
        ]);

        $visitor->update($validated);

        return response()->json([
            'message' => 'Visitor log updated.',
            'data' => $visitor
        ]);
    }

    public function destroy(Visitor $visitor)
    {
        $visitor->delete();

        return response()->json([
            'message' => 'Visitor record removed.'
        ]);
    }
}

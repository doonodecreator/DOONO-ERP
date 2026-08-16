<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hostel;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class HostelController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return response()->json(
            Hostel::when($schoolId, function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->with(['rooms', 'allocations'])
            ->latest()
            ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:Boys,Girls,Mixed',
            'warden_name' => 'nullable|string|max:255',
            'capacity' => 'required|integer|min:1',
        ]);

        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        if ($schoolId) {
            $validated['school_id'] = $schoolId;
        }

        $hostel = Hostel::create($validated);

        return response()->json([
            'message' => 'Hostel created successfully.',
            'data' => $hostel
        ], 201);
    }

    public function show(Hostel $hostel)
    {
        return response()->json($hostel->load(['rooms', 'allocations']));
    }

    public function update(Request $request, Hostel $hostel)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:Boys,Girls,Mixed',
            'warden_name' => 'nullable|string|max:255',
            'capacity' => 'sometimes|integer|min:1',
        ]);

        $hostel->update($validated);

        return response()->json([
            'message' => 'Hostel updated successfully.',
            'data' => $hostel
        ]);
    }

    public function destroy(Hostel $hostel)
    {
        $hostel->delete();

        return response()->json([
            'message' => 'Hostel deleted successfully.'
        ]);
    }
}

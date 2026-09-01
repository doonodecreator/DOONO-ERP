<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolInsightAlert;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SchoolInsightAlertController extends Controller
{
    public function __construct(private CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        return response()->json([
            'data' => SchoolInsightAlert::query()
                ->where('school_id', $schoolId)
                ->latest()
                ->paginate(min(max($request->integer('per_page', 15), 1), 50)),
        ]);
    }

    public function updateStatus(Request $request, SchoolInsightAlert $alert)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $alert->school_id === $schoolId, 404);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['open', 'acknowledged', 'resolved'])],
        ]);
        $status = $validated['status'];
        $userId = $request->user()->id;

        $alert->forceFill([
            'status' => $status,
            'acknowledged_by' => $status === 'acknowledged' ? $userId : ($status === 'open' ? null : $alert->acknowledged_by),
            'acknowledged_at' => $status === 'acknowledged' ? now() : ($status === 'open' ? null : $alert->acknowledged_at),
            'resolved_by' => $status === 'resolved' ? $userId : ($status === 'open' ? null : $alert->resolved_by),
            'resolved_at' => $status === 'resolved' ? now() : ($status === 'open' ? null : $alert->resolved_at),
        ])->save();

        return response()->json(['data' => $alert->fresh()]);
    }

    protected function requireSchool(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'Select an active school before managing insights.');

        return (int) $schoolId;
    }
}

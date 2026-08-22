<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReceptionActivity;
use App\Models\Staff;
use Illuminate\Http\Request;

class ReceptionActivityController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $type = $request->query('type');

        return response()->json([
            'data' => ReceptionActivity::query()
                ->where('school_id', $schoolId)
                ->when($type, fn ($query) => $query->where('type', $type))
                ->with(['staff', 'creator'])
                ->latest('logged_at')
                ->paginate(20),
        ]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'type' => ['required', 'in:staff_check_in,call,message'],
            'staff_id' => ['nullable', 'integer'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string'],
            'status' => ['nullable', 'in:open,follow_up,closed'],
            'logged_at' => ['nullable', 'date'],
        ]);

        if (! empty($data['staff_id'])) {
            abort_unless(
                Staff::whereKey($data['staff_id'])->where('school_id', $schoolId)->exists(),
                422,
                'The selected staff member does not belong to the current school.'
            );
        }

        $activity = ReceptionActivity::create([
            ...$data,
            'school_id' => $schoolId,
            'created_by' => $request->user()->id,
            'status' => $data['status'] ?? 'open',
        ]);

        return response()->json(['data' => $activity->load(['staff', 'creator'])], 201);
    }

    public function update(Request $request, ReceptionActivity $receptionActivity)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $receptionActivity->school_id === $schoolId, 404, 'Reception activity not found.');
        $data = $request->validate([
            'status' => ['sometimes', 'in:open,follow_up,closed'],
            'message' => ['sometimes', 'nullable', 'string'],
            'logged_at' => ['sometimes', 'date'],
        ]);
        $receptionActivity->update($data);

        return response()->json(['data' => $receptionActivity->fresh()->load(['staff', 'creator'])]);
    }

    public function destroy(Request $request, ReceptionActivity $receptionActivity)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $receptionActivity->school_id === $schoolId, 404, 'Reception activity not found.');
        $receptionActivity->delete();

        return response()->json(['message' => 'Reception activity deleted successfully.']);
    }
}

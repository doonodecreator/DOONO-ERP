<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Staff;
use App\Services\CurrentContextService;

class FormTeacherPortalController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($user)?->id;

        if (!$schoolId) {
            return response()->json(['message' => 'No active school context found.'], 403);
        }

        $staff = Staff::where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->first();

        if (!$staff) {
            return response()->json(['message' => 'No active staff record found for this school.'], 403);
        }

        // NOTE: The current ClassModel and Timetable schema have no form_teacher_id field.
        // We return an explicit unavailable state for the form-class data.
        return response()->json([
            'profile' => [
                'first_name' => $staff->first_name,
                'last_name' => $staff->last_name,
                'form_class' => null,
                'total_students' => 0
            ],
            'class_students' => [],
            'pending_tasks' => [
                'behaviour_reports' => 0,
                'parent_messages' => 0
            ],
            'recent_behaviour_logs' => [],
            'message' => 'Form teacher assignment is not yet registered in the school database.'
        ]);
    }
}

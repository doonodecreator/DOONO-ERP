<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class VicePrincipalAcademicController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'academic_info' => [
                'vp_name' => 'Mrs. Grace Adeleke',
                'school_name' => 'Apex Citadel Academy',
                'session' => '2025/2026',
                'term' => '3rd Term',
            ],
            'metrics' => [
                'total_subjects' => 32,
                'active_teachers' => 45,
                'ca_submissions_pct' => '88%',
                'cbt_questions_count' => 1420,
                'pending_results_review' => 6,
            ],
            'subject_assignments' => [
                ['subject' => 'Mathematics', 'classes' => 'SSS 1 - SSS 3', 'assigned_teacher' => 'Mr. Aondover Joseph', 'status' => 'Assigned'],
                ['subject' => 'Physics', 'classes' => 'SSS 1 - SSS 3', 'assigned_teacher' => 'Mr. Samuel Okafor', 'status' => 'Assigned'],
                ['subject' => 'English Language', 'classes' => 'JSS 1 - SSS 3', 'assigned_teacher' => 'Mrs. Grace Adeleke', 'status' => 'Assigned'],
                ['subject' => 'Chemistry', 'classes' => 'SSS 2 - SSS 3', 'assigned_teacher' => 'Unassigned', 'status' => 'Pending'],
            ],
            'exam_schedule_summary' => [
                ['title' => '3rd Term Mock Examinations', 'start_date' => now()->addDays(5)->format('Y-m-d'), 'status' => 'Scheduled'],
                ['title' => 'CBT General Assessment Test', 'start_date' => now()->addDays(12)->format('Y-m-d'), 'status' => 'Draft'],
            ]
        ]);
    }
}

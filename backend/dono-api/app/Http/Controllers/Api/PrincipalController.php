<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PrincipalController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'school_summary' => [
                'school_name' => 'Apex Citadel Academy',
                'principal_name' => 'Dr. Emmanuel Okafor',
                'academic_session' => '2025/2026',
                'term' => '3rd Term',
            ],
            'metrics' => [
                'total_teachers' => 45,
                'total_students' => 840,
                'pending_admissions' => 12,
                'pending_results_approval' => 8,
                'attendance_rate' => '94.2%',
            ],
            'pending_approvals' => [
                ['id' => 1, 'type' => 'Approve Results', 'details' => 'SSS 3 Mock Examination Results', 'submitted_by' => 'VP Academic', 'date' => now()->subHours(2)->format('Y-m-d H:i')],
                ['id' => 2, 'type' => 'Approve Timetable', 'details' => '2025/2026 3rd Term Master Timetable', 'submitted_by' => 'Timetable Committee', 'date' => now()->subDays(1)->format('Y-m-d H:i')],
                ['id' => 3, 'type' => 'Approve Promotions', 'details' => 'JSS 3 to SSS 1 Promotion List', 'submitted_by' => 'Form Master Lead', 'date' => now()->subDays(2)->format('Y-m-d H:i')],
            ],
            'teacher_stats' => [
                ['department' => 'Sciences', 'count' => 14, 'head' => 'Mr. Samuel Okafor'],
                ['department' => 'Arts & Humanities', 'count' => 12, 'head' => 'Mrs. Grace Adeleke'],
                ['department' => 'Commercial', 'count' => 10, 'head' => 'Mr. Victor Igwe'],
                ['department' => 'Mathematics & ICT', 'count' => 9, 'head' => 'Mr. Aondover Joseph'],
            ],
            'recent_announcements' => [
                ['title' => 'End of Term Staff Appraisal Meeting', 'target' => 'All Teachers', 'date' => now()->subDays(1)->format('Y-m-d')],
                ['title' => 'WAEC / NECO Registration Checklist', 'target' => 'Senior Teachers', 'date' => now()->subDays(3)->format('Y-m-d')],
            ]
        ]);
    }
}

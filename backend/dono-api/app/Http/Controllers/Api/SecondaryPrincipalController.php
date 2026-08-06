<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SecondaryPrincipalController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'principal_summary' => [
                'principal_name' => 'Dr. Emmanuel Nwachukwu',
                'school_name' => 'Apex Citadel Secondary School',
                'session' => '2025/2026',
                'term' => '3rd Term',
            ],
            'metrics' => [
                'total_students' => 680,
                'total_teachers' => 38,
                'active_classes' => 18,
                'waec_candidates' => 120,
                'pending_results_approvals' => 5,
            ],
            'streams' => [
                ['name' => 'Junior Secondary Stream (JSS 1 - JSS 3)', 'classes_count' => 9, 'stream_head' => 'Mrs. Grace Adeleke', 'students' => 340],
                ['name' => 'Senior Secondary Stream (SSS 1 - SSS 3)', 'classes_count' => 9, 'stream_head' => 'Mr. Samuel Okafor', 'students' => 340],
            ],
            'external_exams_status' => [
                ['exam' => 'WAEC SSCE 2026', 'candidates' => 120, 'status' => 'Registration Completed'],
                ['exam' => 'NECO SSCE 2026', 'candidates' => 118, 'status' => 'Verification Pending'],
                ['exam' => 'UTME / JAMB 2026', 'candidates' => 110, 'status' => 'Results Published'],
            ]
        ]);
    }
}

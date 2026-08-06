<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PrimaryHeadmasterController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'headmaster_summary' => [
                'headmaster_name' => 'Mr. Christopher Egwu',
                'school_name' => 'Apex Primary School',
                'session' => '2025/2026',
                'term' => '3rd Term',
            ],
            'metrics' => [
                'total_pupils' => 450,
                'total_teachers' => 24,
                'primary_classes' => 12,
                'today_attendance_pct' => '95.4%',
                'pending_promotions' => 18,
            ],
            'classes' => [
                ['name' => 'Primary 1 Gold', 'teacher' => 'Mrs. Mary Oche', 'pupils' => 38],
                ['name' => 'Primary 2 Silver', 'teacher' => 'Mr. Paul Danjuma', 'pupils' => 40],
                ['name' => 'Primary 3 Bronze', 'teacher' => 'Mrs. Sarah Kalu', 'pupils' => 36],
                ['name' => 'Primary 4 Diamond', 'teacher' => 'Mr. John Hassan', 'pupils' => 42],
                ['name' => 'Primary 5 Emerald', 'teacher' => 'Mrs. Ruth Adams', 'pupils' => 39],
                ['name' => 'Primary 6 Pearl', 'teacher' => 'Mr. Peter Audu', 'pupils' => 35],
            ],
            'recent_results' => [
                ['class' => 'Primary 6 Pearl', 'type' => 'Common Entrance Mock Exam', 'status' => 'Awaiting Approval', 'date' => now()->subDays(1)->format('Y-m-d')],
                ['class' => 'Primary 5 Emerald', 'type' => '2nd Continuous Assessment', 'status' => 'Approved', 'date' => now()->subDays(3)->format('Y-m-d')],
            ]
        ]);
    }
}

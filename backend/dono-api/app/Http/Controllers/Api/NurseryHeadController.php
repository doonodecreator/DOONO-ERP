<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NurseryHeadController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'nursery_summary' => [
                'head_name' => 'Mrs. Elizabeth Amadi',
                'school_name' => 'Apex Early Life Nursery',
                'session' => '2025/2026',
                'term' => '3rd Term',
            ],
            'metrics' => [
                'total_pupils' => 180,
                'total_teachers' => 12,
                'nursery_classes' => 6,
                'today_attendance_pct' => '96%',
                'pending_assessments' => 4,
            ],
            'classes' => [
                ['name' => 'Creche / Toddlers', 'teacher' => 'Miss Clara Vance', 'pupils' => 25],
                ['name' => 'Nursery 1 (Butterflies)', 'teacher' => 'Mrs. Hannah John', 'pupils' => 32],
                ['name' => 'Nursery 2 (Stars)', 'teacher' => 'Miss Blessing Dan', 'pupils' => 35],
                ['name' => 'KG 1 (Rainbows)', 'teacher' => 'Mrs. Faith Bassey', 'pupils' => 44],
                ['name' => 'KG 2 (Eagles)', 'teacher' => 'Mr. David Audu', 'pupils' => 44],
            ],
            'recent_assessments' => [
                ['title' => 'Motor Skills & Phonics Evaluation', 'class' => 'Nursery 1', 'date' => now()->subDays(1)->format('Y-m-d')],
                ['title' => 'Early Number Recognition Test', 'class' => 'KG 1', 'date' => now()->subDays(3)->format('Y-m-d')],
            ]
        ]);
    }
}

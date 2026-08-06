<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FormTeacherPortalController extends Controller
{
    public function dashboard(Request $request)
    {
        // In production, fetch the class where the authenticated user is assigned as form teacher
        return response()->json([
            'profile' => [
                'first_name' => 'Aondover',
                'last_name' => 'Staff',
                'form_class' => 'JSS 3 A',
                'total_students' => 52
            ],
            'class_students' => [
                ['id' => 1, 'name' => 'John Doe', 'admission_number' => 'STD-1001', 'attendance_rate' => 95],
                ['id' => 2, 'name' => 'Jane Smith', 'admission_number' => 'STD-1002', 'attendance_rate' => 88],
                ['id' => 3, 'name' => 'Michael Johnson', 'admission_number' => 'STD-1003', 'attendance_rate' => 99],
            ],
            'pending_tasks' => [
                'behaviour_reports' => 3,
                'parent_messages' => 2
            ],
            'recent_behaviour_logs' => [
                ['student' => 'Jane Smith', 'incident' => 'Talkative during prep', 'date' => now()->subDays(1)->format('Y-m-d'), 'status' => 'Pending Review'],
            ]
        ]);
    }
}

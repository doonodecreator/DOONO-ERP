<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TeacherPortalController extends Controller
{
    public function dashboard(Request $request)
    {
        // In production, this will fetch data based on auth()->user()
        // For now, we return structured mock data for the frontend UI

        return response()->json([
            'teacher_profile' => [
                'first_name' => 'Aondover',
                'last_name' => 'Staff',
                'employee_id' => 'EMP-1042',
                'department' => 'Science'
            ],
            'my_classes' => [
                ['id' => 1, 'name' => 'SS 1 Science', 'student_count' => 45],
                ['id' => 2, 'name' => 'JSS 3 A', 'student_count' => 52],
            ],
            'my_subjects' => [
                ['id' => 1, 'name' => 'Mathematics', 'class' => 'SS 1 Science'],
                ['id' => 2, 'name' => 'Basic Science', 'class' => 'JSS 3 A'],
            ],
            'recent_assignments' => [
                ['id' => 1, 'title' => 'Quadratic Equations', 'class' => 'SS 1 Science', 'due_date' => now()->addDays(3)->format('Y-m-d')],
                ['id' => 2, 'title' => 'The Solar System', 'class' => 'JSS 3 A', 'due_date' => now()->addDays(5)->format('Y-m-d')],
            ],
            'pending_tasks' => [
                'upload_ca' => 2,
                'mark_attendance' => 1
            ]
        ]);
    }
}

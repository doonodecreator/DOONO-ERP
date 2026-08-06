<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function dashboard(Request $request)
    {
        // For development/testing, we grab the first student.
        // In production, this would be scoped to auth()->user():
        // $student = Student::where('user_id', auth()->id())->with(['class', 'stream'])->first();
        
        $student = Student::with(['class', 'stream'])->first();

        if (!$student) {
            return response()->json([
                'student_profile' => ['first_name' => 'Demo', 'last_name' => 'Student', 'admission_number' => 'STD-0000'],
                'upcoming_assignments' => [],
                'recent_results' => [],
                'attendance_summary' => ['present' => 0, 'absent' => 0]
            ]);
        }

        return response()->json([
            'student_profile' => $student,
            'upcoming_assignments' => [
                ['id' => 1, 'subject' => 'Mathematics', 'title' => 'Algebra Worksheet', 'due_date' => now()->addDays(2)->format('Y-m-d')],
                ['id' => 2, 'subject' => 'English', 'title' => 'Essay: My Holidays', 'due_date' => now()->addDays(4)->format('Y-m-d')],
            ],
            'recent_results' => [
                ['subject' => 'Physics', 'score' => '85', 'grade' => 'A'],
                ['subject' => 'Chemistry', 'score' => '72', 'grade' => 'B'],
            ],
            'attendance_summary' => [
                'present' => 45,
                'absent' => 3
            ]
        ]);
    }
}

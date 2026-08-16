<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\StudentFee;
use Illuminate\Http\Request;

class ParentPortalController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        // Find the guardian record linked to this user
        $guardian = Guardian::where('user_id', $user->id)
            ->with(['students.class', 'students.division'])
            ->first();

        if (!$guardian) {
            return response()->json([
                'parent_profile' => ['first_name' => $user->name, 'last_name' => ''],
                'children' => [],
                'recent_notices' => [],
                'outstanding_fees' => 0.00,
                'fee_breakdown' => []
            ]);
        }

        $studentIds = $guardian->students->pluck('id');

        // Fetch real outstanding fees for all linked children
        $fees = StudentFee::whereIn('student_enrollment_id', function($query) use ($studentIds) {
                $query->select('id')->from('student_enrollments')->whereIn('student_id', $studentIds);
            })
            ->where('status', '!=', 'paid')
            ->with(['feeCategory', 'studentEnrollment.student'])
            ->get();

        $feeBreakdown = $fees->groupBy('studentEnrollment.student.id')->map(function ($studentFees) {
            $student = $studentFees->first()->studentEnrollment->student;
            return [
                'student_name' => $student->first_name . ' ' . $student->last_name,
                'total_due' => $studentFees->sum('amount_due'),
                'items' => $studentFees->map(fn($f) => [
                    'category' => $f->feeCategory->name,
                    'amount' => $f->amount_due,
                    'status' => $f->status
                ])
            ];
        });

        return response()->json([
            'parent_profile' => $guardian,
            'children' => $guardian->students,
            'recent_notices' => [
                ['id' => 1, 'title' => 'End of Term Examinations', 'date' => now()->addDays(14)->format('Y-m-d')],
                ['id' => 2, 'title' => 'PTA General Meeting', 'date' => now()->addDays(5)->format('Y-m-d')],
            ],
            'outstanding_fees' => $fees->sum('amount_due'),
            'fee_breakdown' => $feeBreakdown
        ]);
    }
}

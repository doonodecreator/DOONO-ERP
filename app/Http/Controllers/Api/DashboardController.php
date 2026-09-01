<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\School;
use App\Models\Student;
use App\Models\Staff;
use App\Models\ParentModel;
use App\Models\Subject;
use App\Models\ClassModel;
use App\Models\Stream;
use App\Models\FeeCategory;
use App\Models\StudentFee;
use App\Models\FeePayment;
use App\Models\Examination;
use App\Models\Attendance;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([

            'organizations' => Organization::count(),
            'schools' => School::count(),
            'students' => Student::count(),
            'staff' => Staff::count(),
            'parents' => ParentModel::count(),
            'subjects' => Subject::count(),
            'classes' => ClassModel::count(),
            'streams' => Stream::count(),
            'fee_categories' => FeeCategory::count(),
            'student_fees' => StudentFee::count(),

            'payments_received' => FeePayment::sum('amount_paid'),

            'outstanding_fees' =>
                StudentFee::sum('amount_due') - FeePayment::sum('amount_paid'),

            'pending_fees' =>
                StudentFee::where('status', 'Pending')->count(),

            'partial_fees' =>
                StudentFee::where('status', 'Partial')->count(),

            'paid_fees' =>
                StudentFee::where('status', 'Paid')->count(),

            'examinations' => Examination::count(),
            'attendance_records' => Attendance::count(),

        ]);
    }
}

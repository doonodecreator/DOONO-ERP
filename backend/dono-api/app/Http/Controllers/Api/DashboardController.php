<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\ClassModel;
use App\Models\Division;
use App\Models\Examination;
use App\Models\FeeCategory;
use App\Models\FeePayment;
use App\Models\Organization;
use App\Models\ParentModel;
use App\Models\School;
use App\Models\Staff;
use App\Models\Stream;
use App\Models\Student;
use App\Models\StudentFee;
use App\Models\Subject;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private CurrentContextService $context)
    {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return response()->json([
                "dashboard_type" => "super_admin",

                "organizations" => Organization::count(),
                "schools" => School::count(),
                "students" => Student::count(),
                "staff" => Staff::count(),
                "parents" => ParentModel::count(),
                "subjects" => Subject::count(),
                "classes" => ClassModel::count(),
                "streams" => Stream::count(),

                "fee_categories" => FeeCategory::count(),
                "student_fees" => StudentFee::count(),

                "payments_received" => FeePayment::sum("amount_paid"),

                "outstanding_fees" =>
                    StudentFee::sum("amount_due") -
                    FeePayment::sum("amount_paid"),

                "pending_fees" =>
                    StudentFee::where("status", "Pending")->count(),

                "partial_fees" =>
                    StudentFee::where("status", "Partial")->count(),

                "paid_fees" =>
                    StudentFee::where("status", "Paid")->count(),

                "attendance_records" => Attendance::count(),
                "examinations" => Examination::count(),
            ]);
        }

        $resolved = $this->context->resolve($user);
        $schoolId = $resolved['school']['id'] ?? null;

        if (!$schoolId) {
            // Shouldn't normally be reachable — this route sits behind
            // has.school middleware — but guarded explicitly rather than
            // letting every query below run with school_id = null.
            return response()->json([
                'success' => false,
                'message' => 'No active school.',
            ], 409);
        }

        $divisionIds = Division::where('school_id', $schoolId)->pluck('id');
        $classIds = ClassModel::whereIn('division_id', $divisionIds)->pluck('id');

        // student_fees / fee_payments / attendances have no direct
        // school_id column — they reach a school only via
        // student_enrollments.school_id. These subqueries filter through
        // that chain instead of assuming a column that doesn't exist.
        $enrollmentIdsForSchool = function ($query) use ($schoolId) {
            $query->select('id')
                ->from('student_enrollments')
                ->where('school_id', $schoolId);
        };

        $studentFeeIdsForSchool = function ($query) use ($enrollmentIdsForSchool) {
            $query->select('id')
                ->from('student_fees')
                ->whereIn('student_enrollment_id', $enrollmentIdsForSchool);
        };

        return response()->json([
            "dashboard_type" => "school",

            "school_id" => $schoolId,

            "students" =>
                Student::where("school_id", $schoolId)->count(),

            "staff" =>
                Staff::where("school_id", $schoolId)->count(),

            "parents" =>
                ParentModel::where("school_id", $schoolId)->count(),

            "subjects" =>
                Subject::where("school_id", $schoolId)->count(),

            "classes" =>
                ClassModel::whereIn("division_id", $divisionIds)->count(),

            "streams" =>
                Stream::whereIn("class_id", $classIds)->count(),

            "fee_categories" =>
                FeeCategory::where("school_id", $schoolId)->count(),

            "student_fees" =>
                StudentFee::whereIn("student_enrollment_id", $enrollmentIdsForSchool)->count(),

            "payments_received" =>
                FeePayment::whereIn("student_fee_id", $studentFeeIdsForSchool)->sum("amount_paid"),

            "outstanding_fees" =>
                StudentFee::whereIn("student_enrollment_id", $enrollmentIdsForSchool)->sum("amount_due")
                - FeePayment::whereIn("student_fee_id", $studentFeeIdsForSchool)->sum("amount_paid"),

            "pending_fees" =>
                StudentFee::whereIn("student_enrollment_id", $enrollmentIdsForSchool)
                    ->where("status", "Pending")
                    ->count(),

            "partial_fees" =>
                StudentFee::whereIn("student_enrollment_id", $enrollmentIdsForSchool)
                    ->where("status", "Partial")
                    ->count(),

            "paid_fees" =>
                StudentFee::whereIn("student_enrollment_id", $enrollmentIdsForSchool)
                    ->where("status", "Paid")
                    ->count(),

            "attendance_records" =>
                Attendance::whereIn("student_enrollment_id", $enrollmentIdsForSchool)->count(),

            "examinations" =>
                Examination::where("school_id", $schoolId)->count(),
        ]);
    }
}

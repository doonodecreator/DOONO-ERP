<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\ClassModel;
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
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Super Admin Dashboard
        |--------------------------------------------------------------------------
        */

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

                "examinations" => Examination::count(),

                "attendance_records" => Attendance::count(),

            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | School Dashboard
        |--------------------------------------------------------------------------
        */

        $schoolId = $user->currentSchoolId();

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
                ClassModel::whereHas("division", function ($query) use ($schoolId) {
                    $query->where("school_id", $schoolId);
                })->count(),

            "streams" =>
                Stream::whereHas("class.division", function ($query) use ($schoolId) {
                    $query->where("school_id", $schoolId);
                })->count(),

            "fee_categories" =>
                FeeCategory::where("school_id", $schoolId)->count(),

            "student_fees" =>
                StudentFee::where("school_id", $schoolId)->count(),

            "payments_received" =>
                FeePayment::where("school_id", $schoolId)
                    ->sum("amount_paid"),

            "outstanding_fees" =>

                StudentFee::where("school_id", $schoolId)
                    ->sum("amount_due")

                -

                FeePayment::where("school_id", $schoolId)
                    ->sum("amount_paid"),

            "pending_fees" =>

                StudentFee::where("school_id", $schoolId)
                    ->where("status", "Pending")
                    ->count(),

            "partial_fees" =>

                StudentFee::where("school_id", $schoolId)
                    ->where("status", "Partial")
                    ->count(),

            "paid_fees" =>

                StudentFee::where("school_id", $schoolId)
                    ->where("status", "Paid")
                    ->count(),

            "attendance_records" =>

                Attendance::where("school_id", $schoolId)
                    ->count(),

            "examinations" =>

                Examination::where("school_id", $schoolId)
                    ->count(),
        ]);
    }
}

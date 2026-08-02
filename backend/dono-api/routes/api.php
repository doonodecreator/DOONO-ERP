<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\AcademicSessionController;
use App\Http\Controllers\Api\TermController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\StreamController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\ExaminationController;
use App\Http\Controllers\Api\ExamScoreController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\FeeCategoryController;
use App\Http\Controllers\Api\StudentFeeController;
use App\Http\Controllers\Api\FeePaymentController;
use App\Http\Controllers\Api\PaymentReceiptController;
use App\Http\Controllers\Api\StudentEnrollmentController;
use App\Http\Controllers\Api\ParentStudentController;
use App\Http\Controllers\Api\StudentPromotionController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\ReportCardController;
use App\Http\Controllers\Api\FeeController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\AdminRevenueController;
use App\Http\Controllers\Api\ParentDashboardController;
use App\Http\Controllers\Api\TeacherDashboardController;
use App\Http\Controllers\Api\ResultEntryController;
use App\Http\Controllers\Api\PromoCampaignController;
use App\Http\Controllers\Api\CurrencyController;
use App\Http\Controllers\Api\CouponController;

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Paystack Public Routes
    |--------------------------------------------------------------------------
    */

    Route::post(
        'payments/paystack/webhook',
        [PaymentController::class, 'webhook']
    );

    Route::get(
        'payments/paystack/verify/{reference}',
        [PaymentController::class, 'verify']
    );

    /*
    |--------------------------------------------------------------------------
    | Public Routes
    |--------------------------------------------------------------------------
    */

    Route::get('/countries', [SchoolController::class, 'countries']);

    Route::post('/schools/register', [SchoolController::class, 'store']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    /*
    |--------------------------------------------------------------------------
    | Protected Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/me', [AuthController::class, 'me']);

        Route::get(
            'admin/revenue-dashboard',
            [AdminRevenueController::class, 'index']
        )->middleware('role:super_admin');

        Route::post('/logout', [AuthController::class, 'logout']);

        Route::get(
            'payments/receipt/{reference}',
            [ReceiptController::class, 'download']
        );

        Route::prefix('result-entry')->group(function () {

            Route::get('/students', [ResultEntryController::class, 'students']);

            Route::get('/form', [ResultEntryController::class, 'form']);

            Route::post('/save', [ResultEntryController::class, 'save']);

            Route::post(
                '/results/{result}/publish',
                [ResultController::class, 'publish']
            );
        });

        Route::apiResource(
            'promo-campaigns',
            PromoCampaignController::class
        );

        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->middleware('role:super_admin,school_admin,vice_principal,bursar');

        Route::get('/system-settings', [SystemSettingController::class, 'index'])
            ->middleware('role:super_admin');

        Route::put('/system-settings', [SystemSettingController::class, 'update'])
            ->middleware('role:super_admin');

        /*
        |--------------------------------------------------------------------------
        | CHANGED SECTION
        |--------------------------------------------------------------------------
        */

        Route::apiResource('organizations', OrganizationController::class)
            ->middleware('role:super_admin,proprietor');

        Route::apiResource('schools', SchoolController::class)
            ->middleware('role:super_admin,proprietor');

        Route::post(
            'schools/{school}/extend-trial',
            [SchoolController::class, 'extendTrial']
        )->middleware('role:super_admin');

        Route::patch(
            'schools/{school}/subscription-status',
            [SchoolController::class, 'updateSubscriptionStatus']
        )->middleware('role:super_admin');

        /*
        |--------------------------------------------------------------------------
        | ERP Modules
        |--------------------------------------------------------------------------
        */

        Route::apiResource('academic-sessions', AcademicSessionController::class);
        Route::apiResource('terms', TermController::class);
        Route::apiResource('divisions', DivisionController::class);
        Route::apiResource('classes', ClassController::class);
        Route::apiResource('streams', StreamController::class);
        Route::apiResource('students', StudentController::class);
        Route::apiResource('parents', ParentController::class);
        Route::apiResource('subjects', SubjectController::class);
        Route::apiResource('staff', StaffController::class);
        Route::apiResource('examinations', ExaminationController::class);
        Route::apiResource('exam-scores', ExamScoreController::class);

        Route::get(
            'attendance/class-list',
            [AttendanceController::class, 'classList']
        );

        Route::apiResource(
            'attendances',
            AttendanceController::class
        );

        Route::apiResource('fee-categories', FeeCategoryController::class);
        Route::apiResource('student-fees', StudentFeeController::class);
        Route::apiResource('fee-payments', FeePaymentController::class);
        Route::apiResource('payment-receipts', PaymentReceiptController::class);
        Route::apiResource('student-enrollments', StudentEnrollmentController::class);
        Route::apiResource('student-promotions', StudentPromotionController::class);
        Route::apiResource('parent-students', ParentStudentController::class);
        Route::apiResource('results', ResultController::class);
        Route::apiResource('timetables', TimetableController::class);
        Route::apiResource('report-cards', ReportCardController::class);
        Route::apiResource('fees', FeeController::class);
        Route::apiResource('subscription-plans', SubscriptionPlanController::class);

        Route::get(
            'payments/history/{school}',
            [PaymentController::class, 'history']
        );

        Route::post(
            'payments/paystack/initialize',
            [PaymentController::class, 'initialize']
        );

        Route::apiResource('currencies', CurrencyController::class);
        Route::apiResource('coupons', CouponController::class);

        Route::get(
            'parent-dashboard/{parent}',
            [ParentDashboardController::class, 'index']
        );

        Route::get(
            'teacher-dashboard/{teacher}',
            [TeacherDashboardController::class, 'index']
        );
    });
});

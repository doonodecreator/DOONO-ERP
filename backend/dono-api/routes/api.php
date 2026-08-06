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
use App\Http\Controllers\Api\SchoolSubscriptionController;
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
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\BookLoanController;
use App\Http\Controllers\Api\HostelController;
use App\Http\Controllers\Api\HostelRoomController;
use App\Http\Controllers\Api\HostelAllocationController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\ClinicVisitController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\TransportRouteController;
use App\Http\Controllers\Api\TransportAllocationController;
use App\Http\Controllers\Api\VisitorController;
use App\Http\Controllers\Api\StudentGatePassController;
use App\Http\Controllers\Api\ReceptionAppointmentController;
use App\Http\Controllers\Api\TeacherPortalController;
use App\Http\Controllers\Api\FormTeacherPortalController;
use App\Http\Controllers\Api\PlatformOwnerController;
use App\Http\Controllers\Api\OrganizationOwnerController;
use App\Http\Controllers\Api\ProprietorController;
use App\Http\Controllers\Api\PrincipalController;
use App\Http\Controllers\Api\VicePrincipalAcademicController;
use App\Http\Controllers\Api\VicePrincipalAdminController;
use App\Http\Controllers\Api\NurseryHeadController;
use App\Http\Controllers\Api\PrimaryHeadmasterController;
use App\Http\Controllers\Api\SecondaryPrincipalController;
use App\Http\Controllers\Api\StudentPortalController;
use App\Http\Controllers\Api\ParentPortalController;

Route::prefix('v1')->group(function () {

    Route::post('payments/paystack/webhook', [PaymentController::class, 'webhook']);
    Route::get('payments/paystack/verify/{reference}', [PaymentController::class, 'verify']);

    Route::get('/countries', [SchoolController::class, 'countries']);

    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('schools/{school}/toggle-exemption', [SchoolController::class, 'toggleExemption']);
        Route::post('schools/{school}/grant-timeframe', [SchoolController::class, 'grantCustomTimeframe']);
        Route::post('schools/{school}/set-discount', [SchoolController::class, 'setDiscount']);

        Route::get('/me/context', [AuthController::class, 'context']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::post('/schools', [SchoolController::class, 'store']);

        Route::get('/schools', [SchoolController::class, 'index']);
        Route::get('/schools/{school}', [SchoolController::class, 'show']);
        Route::put('/schools/{school}', [SchoolController::class, 'update']);
        Route::delete('/schools/{school}', [SchoolController::class, 'destroy'])
            ->middleware('role:super_admin,proprietor');

        Route::post('schools/{school}/extend-trial', [SchoolController::class, 'extendTrial'])
            ->middleware('role:super_admin');

        Route::patch('schools/{school}/subscription-status', [SchoolController::class, 'updateSubscriptionStatus'])
            ->middleware('role:super_admin');

        Route::apiResource('organizations', OrganizationController::class)
            ->middleware('role:super_admin,proprietor');

        Route::get('admin/revenue-dashboard', [AdminRevenueController::class, 'index'])
            ->middleware('role:super_admin');

        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->middleware('role:super_admin,proprietor,principal,vice_principal,bursar');

        Route::get('/system-settings', [SystemSettingController::class, 'index'])
            ->middleware('role:super_admin');

        Route::put('/system-settings', [SystemSettingController::class, 'update'])
            ->middleware('role:super_admin');

        Route::apiResource('promo-campaigns', PromoCampaignController::class);
        Route::apiResource('currencies', CurrencyController::class);
        Route::apiResource('coupons', CouponController::class);
        Route::apiResource('subscription-plans', SubscriptionPlanController::class);
        Route::apiResource('school-subscriptions', SchoolSubscriptionController::class);

        Route::get('payments/receipt/{reference}', [ReceiptController::class, 'download']);
        Route::get('payments/history/{school}', [PaymentController::class, 'history']);
        Route::post('payments/paystack/initialize', [PaymentController::class, 'initialize']);

        Route::middleware(['has.school', 'subscription'])->group(function () {
            Route::get('school-settings', [\App\Http\Controllers\Api\SchoolSettingController::class, 'show']);
            Route::put('school-settings', [\App\Http\Controllers\Api\SchoolSettingController::class, 'update']);
            Route::get('academic-settings', [\App\Http\Controllers\Api\AcademicSettingController::class, 'show']);
            Route::put('academic-settings', [\App\Http\Controllers\Api\AcademicSettingController::class, 'update']);

            Route::prefix('result-entry')->group(function () {
                Route::get('/students', [ResultEntryController::class, 'students']);
                Route::get('/form', [ResultEntryController::class, 'form']);
                Route::post('/save', [ResultEntryController::class, 'save']);
                Route::post('/results/{result}/publish', [ResultController::class, 'publish']);
            });

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

            Route::get('attendance/class-list', [AttendanceController::class, 'classList']);
            Route::post('attendances/bulk', [AttendanceController::class, 'bulkStore']);
            Route::apiResource('attendances', AttendanceController::class);

            Route::apiResource('books', BookController::class);
            Route::apiResource('book-loans', BookLoanController::class);

            Route::apiResource('hostels', HostelController::class);
            Route::apiResource('hostel-rooms', HostelRoomController::class);
            Route::apiResource('hostel-allocations', HostelAllocationController::class);

            Route::get('teacher/dashboard', [TeacherPortalController::class, 'dashboard'])
                ->middleware('role:teacher');
            Route::get('form-teacher/dashboard', [FormTeacherPortalController::class, 'dashboard'])
                ->middleware('role:teacher');
            Route::get('platform-owner/dashboard', [PlatformOwnerController::class, 'dashboard'])
                ->middleware('role:super_admin');
            Route::get('org-owner/dashboard', [OrganizationOwnerController::class, 'dashboard'])
                ->middleware('role:super_admin,proprietor');
            Route::get('proprietor/dashboard', [ProprietorController::class, 'dashboard'])
                ->middleware('role:super_admin,proprietor');
            Route::get('principal/dashboard', [PrincipalController::class, 'dashboard'])
                ->middleware('role:super_admin,principal');
            Route::get('vp-academic/dashboard', [VicePrincipalAcademicController::class, 'dashboard'])
                ->middleware('role:super_admin,vice_principal');
            Route::get('vp-admin/dashboard', [VicePrincipalAdminController::class, 'dashboard'])
                ->middleware('role:super_admin,head_teacher');
            Route::get('nursery-head/dashboard', [NurseryHeadController::class, 'dashboard'])
                ->middleware('role:super_admin,nursery_head');
            Route::get('primary-headmaster/dashboard', [PrimaryHeadmasterController::class, 'dashboard'])
                ->middleware('role:super_admin,primary_headmaster');
            Route::get('secondary-principal/dashboard', [SecondaryPrincipalController::class, 'dashboard'])
                ->middleware('role:super_admin,secondary_principal');

            Route::apiResource('fee-categories', FeeCategoryController::class);
            Route::apiResource('student-fees', StudentFeeController::class);
            Route::apiResource('fee-payments', FeePaymentController::class);
            Route::apiResource('payment-receipts', PaymentReceiptController::class);
            Route::apiResource('student-enrollments', StudentEnrollmentController::class);
            Route::apiResource('student-promotions', StudentPromotionController::class);
            Route::apiResource('parent-students', ParentStudentController::class);
            Route::apiResource('results', ResultController::class);
            Route::apiResource('timetables', TimetableController::class);
            Route::get('report-cards/{reportCard}/download-pdf', [ReportCardController::class, 'downloadPdf']);
            Route::apiResource('report-cards', ReportCardController::class);
            Route::apiResource('fees', FeeController::class);
            Route::apiResource('expenses', ExpenseController::class);

            Route::apiResource('medical-records', MedicalRecordController::class);
            Route::apiResource('clinic-visits', ClinicVisitController::class);

            Route::get('parent-dashboard/{parent}', [ParentDashboardController::class, 'index']);
            Route::get('teacher-dashboard/{teacher}', [TeacherDashboardController::class, 'index']);

            Route::apiResource('vehicles', VehicleController::class);
            Route::apiResource('transport-routes', TransportRouteController::class);
            Route::apiResource('transport-allocations', TransportAllocationController::class);
            Route::apiResource('visitors', VisitorController::class);
            Route::apiResource('student-gate-passes', StudentGatePassController::class);
            Route::apiResource('reception-appointments', ReceptionAppointmentController::class);

            Route::get('student/dashboard', [StudentPortalController::class, 'dashboard']);
            Route::get('parent/dashboard', [ParentPortalController::class, 'dashboard']);
        });
    });
});

<?php

use App\Http\Controllers\Api\AcademicSessionController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\ExaminationController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PlatformOwnerController;
use App\Http\Controllers\Api\PromoCampaignController;
use App\Http\Controllers\Api\ReportCardController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\ResultEntryController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RoleInvitationController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\SchoolSubscriptionController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StreamController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentEnrollmentController;
use App\Http\Controllers\Api\StudentPromotionController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\TermController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me/context', [AuthController::class, 'context']);

        Route::middleware('role:super_admin')->group(function () {
            Route::get('/platform-owner/dashboard', [PlatformOwnerController::class, 'dashboard']);
            Route::post('/platform-owner/impersonate', [PlatformOwnerController::class, 'impersonateUser']);
            Route::apiResource('subscription-plans', SubscriptionPlanController::class)->except(['index', 'show']);
            Route::apiResource('coupons', CouponController::class);
            Route::apiResource('promo-campaigns', PromoCampaignController::class);
            Route::apiResource('school-subscriptions', SchoolSubscriptionController::class);
            Route::apiResource('system-settings', SystemSettingController::class)->only(['index', 'update']);
            
            // Missing School Admin Actions
            Route::post('schools/{school}/toggle-exemption', [SchoolController::class, 'toggleExemption']);
            Route::post('schools/{school}/grant-timeframe', [SchoolController::class, 'grantCustomTimeframe']);
            Route::post('schools/{school}/set-discount', [SchoolController::class, 'setDiscount']);
        });

        Route::get('subscription-plans', [SubscriptionPlanController::class, 'index'])->middleware('role:super_admin,proprietor');
        Route::get('subscription-plans/{subscription_plan}', [SubscriptionPlanController::class, 'show'])->middleware('role:super_admin,proprietor');
        Route::get('my-subscription', [SchoolSubscriptionController::class, 'mySubscription'])->middleware('role:super_admin,proprietor');

        Route::prefix('payments')->group(function () {
            Route::post('/initialize', [PaymentController::class, 'initialize']);
            Route::get('/verify/{reference}', [PaymentController::class, 'verify']);
            Route::post('/initialize-subscription', [PaymentController::class, 'initializeSubscription'])->middleware('role:proprietor');
            Route::get('/verify-subscription/{reference}', [PaymentController::class, 'verifySubscription']);
        });

        Route::apiResource('organizations', OrganizationController::class)->middleware('role:super_admin,proprietor');
        Route::apiResource('schools', SchoolController::class)->middleware('role:super_admin,proprietor');

        Route::prefix('role-invitations')->group(function () {
            Route::get('/', [RoleInvitationController::class, 'index'])->middleware('role:proprietor');
            Route::post('/', [RoleInvitationController::class, 'store'])->middleware('role:proprietor');
            Route::get('/preview/{token}', [RoleInvitationController::class, 'preview'])->withoutMiddleware('auth:sanctum');
            Route::post('/accept', [RoleInvitationController::class, 'accept'])->withoutMiddleware('auth:sanctum');
            Route::post('/accept-authenticated', [RoleInvitationController::class, 'acceptAuthenticated']);
            Route::delete('/{roleInvitation}', [RoleInvitationController::class, 'revoke'])->middleware('role:proprietor');
        });

        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::apiResource('academic-sessions', AcademicSessionController::class);
        Route::apiResource('terms', TermController::class);
        Route::apiResource('divisions', DivisionController::class);
        Route::apiResource('classes', ClassController::class);
        Route::apiResource('streams', StreamController::class);
        Route::apiResource('subjects', SubjectController::class);
        Route::apiResource('students', StudentController::class);
        Route::apiResource('parents', ParentController::class);
        Route::apiResource('staff', StaffController::class);
        Route::apiResource('enrollments', StudentEnrollmentController::class);
        Route::apiResource('promotions', StudentPromotionController::class);
        Route::get('attendance', [AttendanceController::class, 'index']);
        Route::get('attendance/class-list', [AttendanceController::class, 'classList']);
        Route::post('attendance/bulk', [AttendanceController::class, 'bulkStore']);
        Route::get('results', [ResultController::class, 'index']);
        Route::post('results/{result}/publish', [ResultController::class, 'publish']);
        Route::get('report-cards', [ReportCardController::class, 'index']);
        Route::get('report-cards/{reportCard}/download', [ReportCardController::class, 'downloadPdf']);
        Route::prefix('result-entry')->group(function () {
            Route::get('/students', [ResultEntryController::class, 'students']);
            Route::post('/save', [ResultEntryController::class, 'save']);
        });
    });
});

Route::post('v1/payments/webhook', [PaymentController::class, 'webhook']);

<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\AcademicSessionController;
use App\Http\Controllers\Api\AdmissionController;
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

    /*
    |--------------------------------------------------------------------------
    | Public Routes
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

    Route::get(
        '/countries',
        [SchoolController::class, 'countries']
    );

    Route::get(
        '/roles',
        [\App\Http\Controllers\Api\RoleController::class, 'index']
    )->middleware('auth:sanctum');

    Route::post(
        '/register',
        [AuthController::class, 'register']
    );

    Route::post(
        '/login',
        [AuthController::class, 'login']
    );


    /*
    |--------------------------------------------------------------------------
    | Protected — Authenticated
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Platform Admin Subscription Overrides
        |--------------------------------------------------------------------------
        */

        Route::post(
            'schools/{school}/toggle-exemption',
            [SchoolController::class, 'toggleExemption']
        )->middleware('role:super_admin');

        Route::post(
            'schools/{school}/grant-timeframe',
            [SchoolController::class, 'grantCustomTimeframe']
        )->middleware('role:super_admin');

        Route::post(
            'schools/{school}/set-discount',
            [SchoolController::class, 'setDiscount']
        )->middleware('role:super_admin');

/*
        |--------------------------------------------------------------------------
        | Authentication / Context
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/me/context',
            [AuthController::class, 'context']
        );

        Route::post(
            '/logout',
            [AuthController::class, 'logout']
        );


        /*
        |--------------------------------------------------------------------------
        | School Management
        |--------------------------------------------------------------------------
        */

        Route::post(
            '/schools',
            [SchoolController::class, 'store']
        );

        Route::get(
            '/schools',
            [SchoolController::class, 'index']
        );

        Route::get(
            '/schools/{school}',
            [SchoolController::class, 'show']
        );

        Route::put(
            '/schools/{school}',
            [SchoolController::class, 'update']
        );

        Route::delete(
            '/schools/{school}',
            [SchoolController::class, 'destroy']
        )->middleware('role:super_admin,proprietor');

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
        | Organizations
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'organizations',
            OrganizationController::class
        )->middleware('role:super_admin,proprietor');


        /*
        |--------------------------------------------------------------------------
        | Admin Revenue
        |--------------------------------------------------------------------------
        */

        Route::get(
            'admin/revenue-dashboard',
            [AdminRevenueController::class, 'index']
        )->middleware('role:super_admin');


        /*
        |--------------------------------------------------------------------------
        | General Dashboard
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/dashboard',
            [DashboardController::class, 'index']
        )->middleware(
            'role:super_admin,proprietor,principal,vice_principal_academic,vice_principal_admin,bursar'
        );


        /*
        |--------------------------------------------------------------------------
        | System Settings
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/system-settings',
            [SystemSettingController::class, 'index']
        )->middleware('role:super_admin');

        Route::put(
            '/system-settings',
            [SystemSettingController::class, 'update']
        )->middleware('role:super_admin');


        /*
        |--------------------------------------------------------------------------
        | SUBSCRIPTION MANAGEMENT
        |
        | IMPORTANT:
        |
        | Subscription plans and school subscriptions are platform-owned.
        |
        | Schools/proprietors DO NOT get access to the subscription
        | catalog and cannot create/update/delete subscriptions.
        |
        | Only the platform owner (super_admin) can manage them.
        |--------------------------------------------------------------------------
        */

        /*
        |--------------------------------------------------------------------------
        | Subscription Plans
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'subscription-plans',
            SubscriptionPlanController::class
        )->middleware('role:super_admin');


        /*
        |--------------------------------------------------------------------------
        | School Subscriptions
        |--------------------------------------------------------------------------
        |
        | Only super_admin can perform CRUD operations.
        |
        */

        Route::apiResource(
            'school-subscriptions',
            SchoolSubscriptionController::class
        )->middleware('role:super_admin');


/*
        |--------------------------------------------------------------------------
        | My Subscription
        |--------------------------------------------------------------------------
        |
        | Schools/proprietors can ONLY view their own subscription.
        |
        | They cannot:
        |
        | - create a subscription
        | - change plan
        | - change price
        | - change billing cycle
        | - change dates
        | - change status
        | - delete subscription
        |
        */

        Route::get(
            'my-subscription',
            [SchoolSubscriptionController::class, 'mySubscription']
        )->middleware('role:proprietor,super_admin');


        /*
        |--------------------------------------------------------------------------
        | Coupons
        |--------------------------------------------------------------------------
        |
        | Only the platform owner manages coupons.
        |
        */

        Route::apiResource(
            'coupons',
            CouponController::class
        )->middleware('role:super_admin');


        /*
        |--------------------------------------------------------------------------
        | Promotional Campaigns
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'promo-campaigns',
            PromoCampaignController::class
        )->middleware('role:super_admin');


        /*
        |--------------------------------------------------------------------------
        | Currency Reference Data
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'currencies',
            CurrencyController::class
        );


        /*
        |--------------------------------------------------------------------------
        | Payment Routes
        |--------------------------------------------------------------------------
        |
        | These existing routes are for school/student fee payments.
        | They are NOT being converted into subscription payments.
        |
        |--------------------------------------------------------------------------
        */

        Route::get(
            'payments/receipt/{reference}',
            [ReceiptController::class, 'download']
        );

        Route::get(
            'payments/history/{school}',
            [PaymentController::class, 'history']
        );

        Route::post(
            'payments/paystack/initialize',
            [PaymentController::class, 'initialize']
        );


        /*
        |--------------------------------------------------------------------------
        | Everything Below Requires:
        |
        | 1. Authenticated user
        | 2. Current school
        | 3. Active subscription
        |
        | CheckActiveSubscription is handled by the subscription middleware.
        |--------------------------------------------------------------------------
        */

        Route::middleware([
            'has.school',
            'subscription',
        ])->group(function () {

            /*
            |--------------------------------------------------------------------------
            | School Settings
            |--------------------------------------------------------------------------
            */

            Route::get(
                'school-settings',
                [\App\Http\Controllers\Api\SchoolSettingController::class, 'show']
            );

            Route::put(
                'school-settings',
                [\App\Http\Controllers\Api\SchoolSettingController::class, 'update']
            );

            Route::get(
                'academic-settings',
                [\App\Http\Controllers\Api\AcademicSettingController::class, 'show']
            );

            Route::put(
                'academic-settings',
                [\App\Http\Controllers\Api\AcademicSettingController::class, 'update']
            );


/*
            |--------------------------------------------------------------------------
            | Result Entry
            |--------------------------------------------------------------------------
            */

            Route::prefix('result-entry')->group(function () {

                Route::get(
                    '/students',
                    [ResultEntryController::class, 'students']
                );

                Route::get(
                    '/form',
                    [ResultEntryController::class, 'form']
                );

                Route::post(
                    '/save',
                    [ResultEntryController::class, 'save']
                );

                Route::post(
                    '/results/{result}/publish',
                    [ResultController::class, 'publish']
                );
            });


            /*
            |--------------------------------------------------------------------------
            | Academic Management
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'academic-sessions',
                AcademicSessionController::class
            );

            Route::apiResource(
                'terms',
                TermController::class
            );

            Route::apiResource(
                'divisions',
                DivisionController::class
            );

            Route::apiResource(
                'classes',
                ClassController::class
            );

            Route::apiResource(
                'streams',
                StreamController::class
            );

            Route::post(
                'admissions',
                [AdmissionController::class, 'store']
            )->middleware('role:super_admin,proprietor,principal,vice_principal_admin');

            Route::apiResource(
                'students',
                StudentController::class
            )->only(['index', 'show']);

            Route::apiResource(
                'students',
                StudentController::class
            )->only(['update', 'destroy'])->middleware(
                'role:super_admin,proprietor,principal,vice_principal_admin'
            );

            Route::apiResource(
                'parents',
                ParentController::class
            );

            Route::apiResource(
                'subjects',
                SubjectController::class
            );

            Route::apiResource(
                'staff',
                StaffController::class
            );

            Route::apiResource(
                'examinations',
                ExaminationController::class
            );

            Route::apiResource(
                'exam-scores',
                ExamScoreController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Attendance
            |--------------------------------------------------------------------------
            */

            Route::get(
                'attendance/class-list',
                [AttendanceController::class, 'classList']
            );

            Route::post(
                'attendances/bulk',
                [AttendanceController::class, 'bulkStore']
            );

            Route::apiResource(
                'attendances',
                AttendanceController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Library
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'books',
                BookController::class
            );

            Route::apiResource(
                'book-loans',
                BookLoanController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Hostel
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'hostels',
                HostelController::class
            );

            Route::apiResource(
                'hostel-rooms',
                HostelRoomController::class
            );

            Route::apiResource(
                'hostel-allocations',
                HostelAllocationController::class
            );

/*
            |--------------------------------------------------------------------------
            | Role-Specific Dashboards
            |--------------------------------------------------------------------------
            */

            Route::get(
                'teacher/dashboard',
                [TeacherPortalController::class, 'dashboard']
            )->middleware('role:teacher');

            Route::get(
                'form-teacher/dashboard',
                [FormTeacherPortalController::class, 'dashboard']
            )->middleware('role:form_teacher');

            Route::get(
                'platform-owner/dashboard',
                [PlatformOwnerController::class, 'dashboard']
            )->middleware('role:super_admin');

            Route::get(
                'org-owner/dashboard',
                [OrganizationOwnerController::class, 'dashboard']
            )->middleware('organization.owner');

            Route::get(
                'proprietor/dashboard',
                [ProprietorController::class, 'dashboard']
            )->middleware('role:super_admin,proprietor');

            Route::get(
                'principal/dashboard',
                [PrincipalController::class, 'dashboard']
            )->middleware('role:super_admin,principal');

            Route::get(
                'vp-academic/dashboard',
                [VicePrincipalAcademicController::class, 'dashboard']
            )->middleware('role:super_admin,vice_principal_academic');

            Route::get(
                'vp-admin/dashboard',
                [VicePrincipalAdminController::class, 'dashboard']
            )->middleware('role:super_admin,vice_principal_admin');

            Route::get(
                'nursery-head/dashboard',
                [NurseryHeadController::class, 'dashboard']
            )->middleware('role:super_admin,nursery_head');

            Route::get(
                'primary-headmaster/dashboard',
                [PrimaryHeadmasterController::class, 'dashboard']
            )->middleware('role:super_admin,primary_headmaster');

            Route::get(
                'secondary-principal/dashboard',
                [SecondaryPrincipalController::class, 'dashboard']
            )->middleware('role:super_admin,secondary_principal');


            /*
            |--------------------------------------------------------------------------
            | Fees
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'fee-categories',
                FeeCategoryController::class
            );

            Route::apiResource(
                'student-fees',
                StudentFeeController::class
            );

            Route::apiResource(
                'fee-payments',
                FeePaymentController::class
            );

            Route::apiResource(
                'payment-receipts',
                PaymentReceiptController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Students
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'student-enrollments',
                StudentEnrollmentController::class
            )->middleware(
                'role:super_admin,proprietor,principal,vice_principal_academic,vice_principal_admin'
            );

            Route::apiResource(
                'student-promotions',
                StudentPromotionController::class
            );

            Route::apiResource(
                'parent-students',
                ParentStudentController::class
            )->middleware(
                'role:super_admin,proprietor,principal,vice_principal_admin'
            );


            /*
            |--------------------------------------------------------------------------
            | Results
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'results',
                ResultController::class
            );

            Route::apiResource(
                'timetables',
                TimetableController::class
            );

            Route::get(
                'report-cards/{reportCard}/download-pdf',
                [ReportCardController::class, 'downloadPdf']
            );

            Route::apiResource(
                'report-cards',
                ReportCardController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Finance
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'fees',
                FeeController::class
            );

            Route::apiResource(
                'expenses',
                ExpenseController::class
            );

/*
            |--------------------------------------------------------------------------
            | Medical
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'medical-records',
                MedicalRecordController::class
            );

            Route::apiResource(
                'clinic-visits',
                ClinicVisitController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Parent / Teacher Dashboards
            |--------------------------------------------------------------------------
            */

            Route::get(
                'parent-dashboard/{parent}',
                [ParentDashboardController::class, 'index']
            );

            Route::get(
                'teacher-dashboard/{teacher}',
                [TeacherDashboardController::class, 'index']
            );


            /*
            |--------------------------------------------------------------------------
            | Transport
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'vehicles',
                VehicleController::class
            );

            Route::apiResource(
                'transport-routes',
                TransportRouteController::class
            );

            Route::apiResource(
                'transport-allocations',
                TransportAllocationController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Reception / Visitor Management
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'visitors',
                VisitorController::class
            );

            Route::apiResource(
                'student-gate-passes',
                StudentGatePassController::class
            );

            Route::apiResource(
                'reception-appointments',
                ReceptionAppointmentController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Student / Parent Portals
            |--------------------------------------------------------------------------
            */

            Route::get(
                'student/dashboard',
                [StudentPortalController::class, 'dashboard']
            );

            Route::get(
                'parent/dashboard',
                [ParentPortalController::class, 'dashboard']
            );
        });
    });
});


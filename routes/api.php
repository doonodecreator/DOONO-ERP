<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
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

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Public Authentication
    |--------------------------------------------------------------------------
    */

    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    /*
    |--------------------------------------------------------------------------
    | ERP Modules
    |--------------------------------------------------------------------------
    */

    Route::apiResource('organizations', OrganizationController::class);
    Route::apiResource('schools', SchoolController::class);
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
    Route::apiResource('attendances', AttendanceController::class);
    Route::apiResource('fee-categories', FeeCategoryController::class);
    Route::apiResource('student-fees', StudentFeeController::class);
    Route::apiResource('fee-payments', FeePaymentController::class);
    Route::apiResource('payment-receipts', PaymentReceiptController::class);
    /*
    |--------------------------------------------------------------------------
    | Protected Authentication
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

    });

});

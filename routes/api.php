<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\AcademicSessionController;
use App\Http\Controllers\Api\TermController;

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
    | Organization Module
    |--------------------------------------------------------------------------
    */

    Route::apiResource('organizations', OrganizationController::class);

    /*
    |--------------------------------------------------------------------------
    | School Module
    |--------------------------------------------------------------------------
    */

    Route::apiResource('schools', SchoolController::class);

    /*
    |--------------------------------------------------------------------------
    | Academic Session Module
    |--------------------------------------------------------------------------
    */

    Route::apiResource('academic-sessions', AcademicSessionController::class);

    /*
    |--------------------------------------------------------------------------
    | Term Module
    |--------------------------------------------------------------------------
    */

    Route::apiResource('terms', TermController::class);

    /*
    |--------------------------------------------------------------------------
    | Protected Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/me', [AuthController::class, 'me']);

        Route::post('/logout', [AuthController::class, 'logout']);

    });

});

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\CompanySettingsController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\NotificationController;

Route::prefix('auth')->group(function () {
    Route::post('/registerCompany', [AuthController::class, 'registerCompany'])->middleware('auth:sanctum');
    Route::post('/registerUser', [AuthController::class, 'registerUser'])->middleware('auth:sanctum');
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/companies', [CompanyController::class, 'index']);
    Route::post('/companies', [CompanyController::class, 'store']);
    Route::put('/companies/{id}', [CompanyController::class, 'update']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::get('/incidents/{id}', [IncidentController::class, 'show']);
    Route::put('/incidents/{id}', [IncidentController::class, 'update']);
    Route::delete('/incidents/{id}', [IncidentController::class, 'destroy']);
    Route::patch('/incidents/{id}/status', [IncidentController::class, 'updateStatus']);
    Route::patch('/incidents/{id}/assign', [IncidentController::class, 'assign']);

    Route::get('/incidents/{id}/comments', [CommentController::class, 'index']);
    Route::post('/incidents/{id}/comments', [CommentController::class, 'store']);

    Route::get('/incidents/{id}/attachments', [AttachmentController::class, 'index']);
    Route::post('/incidents/{id}/attachments', [AttachmentController::class, 'store']);

    Route::get('/company-settings', [CompanySettingsController::class, 'show']);
    Route::put('/company-settings', [CompanySettingsController::class, 'update']);

    Route::get('/stats/system', [StatsController::class, 'system']);
    Route::get('/stats/company', [StatsController::class, 'company']);
    Route::get('/stats/by-company', [StatsController::class, 'byCompany']);
    Route::get('/stats/by-technician', [StatsController::class, 'byTechnician']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
});

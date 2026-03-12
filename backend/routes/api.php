<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\CompanySettingsController;

// Autenticación
Route::post('/register-company', [AuthController::class, 'registerCompany']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Middleware auth
Route::middleware('auth:sanctum')->group(function () {
    // Usuarios
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Incidencias
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::get('/incidents/{id}', [IncidentController::class, 'show']);
    Route::put('/incidents/{id}', [IncidentController::class, 'update']);

    // Comentarios
    Route::get('/incidents/{id}/comments', [CommentController::class, 'index']);
    Route::post('/incidents/{id}/comments', [CommentController::class, 'store']);

    // Archivos
    Route::get('/incidents/{id}/attachments', [AttachmentController::class, 'index']);
    Route::post('/incidents/{id}/attachments', [AttachmentController::class, 'store']);

    // Configuración empresa
    Route::get('/company-settings', [CompanySettingsController::class, 'show']);
    Route::put('/company-settings', [CompanySettingsController::class, 'update']);
});
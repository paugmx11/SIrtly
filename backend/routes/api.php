<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IncidentController;

Route::prefix('auth')->group(function () {
    Route::post('/registerCompany', [AuthController::class, 'registerCompany'])->middleware('auth:sanctum');
    Route::post('/registerUser', [AuthController::class, 'registerUser'])->middleware('auth:sanctum');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::get('/incidents/{id}', [IncidentController::class, 'show']);
    Route::patch('/incidents/{id}/status', [IncidentController::class, 'updateStatus']);
});

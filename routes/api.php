<?php

use App\Http\Controllers\Api\CompanyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('companies/stats', [CompanyController::class, 'stats'])->name('companies.stats');
    Route::delete('companies', [CompanyController::class, 'destroyMany'])->name('companies.destroyMany');
    Route::apiResource('companies', CompanyController::class);
});

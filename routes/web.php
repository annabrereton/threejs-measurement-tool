<?php

use App\Http\Controllers\MeasurementController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;

Route::get('/', [HomeController::class, 'home'])->name('home');
Route::get('/measurements', [MeasurementController::class, 'index']);
Route::post('measurements', [MeasurementController::class, 'store'])->name('measurements.store');

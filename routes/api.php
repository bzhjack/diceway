<?php
use App\Http\Controllers\Auth\RegisterController;
use \App\Http\Controllers\Auth\HelloController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

/**
 * Api publiques
 */
Route::middleware([\App\Http\Middleware\RequestAcceptJson::class])->group(function () {
    Route::get('hello', [HelloController::class, 'hello']);
    Route::post('auth/register', [RegisterController::class, 'register']);
});
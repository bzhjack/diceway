<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{

    public function logout(Request $request): array
    {
        $credentials = $request->validate([
            'id' => ['required']
        ]);
        $user = User::find($credentials["id"]);
        $user->tokens()->delete();
        return ["user" => $credentials["id"]];
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);
        if (auth()->attempt($credentials)) {
            $id = Auth::id();
            $user = User::find($id);
            if ($user->hasVerifiedEmail() != 1) {
                return response()->json(['error' => 'email not verified'], 403);
            }
            $token = $user->createToken('diceway', ['*'], now()->addWeek())->plainTextToken;
            //now return this token on success login attempt
            return response()->json(['user' => $user, 'token' => $token], 200);
        } else {
            //wrong login credentials, return, user not authorised to our system, return error code 401
            return response()->json(['error' => 'UnAuthorised Access'], 401);
        }
    }
}

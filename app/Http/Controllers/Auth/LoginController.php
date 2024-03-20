<?php

namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(Request $request){
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);
        if(auth()->attempt($credentials)){
            //generate the token for the user
            //$user_login_token= Auth::user()->createToken('diceway')->accessToken;
            /*if (Auth::user()->hasVerifiedEmail() != 1 ) {
                return response()->json(['error'=> 'email not verified'], 403);
            }*/
            //now return this token on success login attempt
            $user = Auth::user();
            return response()->json(['user'=> Auth::user()], 200);
        }
        else{
            //wrong login credentials, return, user not authorised to our system, return error code 401
            return response()->json(['error' => 'UnAuthorised Access'], 401);
        }
    }
}
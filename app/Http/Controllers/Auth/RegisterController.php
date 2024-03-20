<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Registered;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|confirmed'
        ]);
        $data['password'] = bcrypt($request->password);
        $user = User::create($data);
        $token = $user->createToken('diceway')->accessToken;
        event(new Registered($user));
        return response([ 'user' => $user, 'token' => $token]);
    }
}

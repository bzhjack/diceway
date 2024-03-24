<?php

namespace App\Http\Controllers\Auth;


use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Auth\Events\Verified;

class SocialController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callbackFromGoogle()
    {
        $user = Socialite::driver('google')->stateless()->user();
        $this->registerOrLoginUser($user);
        $id = Auth::id();
        $user = User::find($id);
        $token = $user->createToken('diceway')->plainTextToken;
        $host = "";
        if (env('APP_MODE') == "dev") {
            $host = "http://localhost:4200";
        }
        return redirect($host . '/callback/' . $token);
    }

    protected function registerOrLoginUser($data)
    {
        $newUser = false;
        $user = User::where('email', '=', $data->email)->first();
        if (!$user) {
            $newUser = true;
            $user = new \App\Models\User();
            $user->name = $data->name;
            $user->email = $data->email;
            $user->provider_id = $data->id;
            $user->avatar = $data->avatar;
        } else {
            $user->provider_id = $data->id;
            $user->avatar = $data->avatar;
        }
        $user->save();
        Auth::login($user);
        if ($newUser && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }
    }
}

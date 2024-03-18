<?php
namespace App\Http\Controllers\Auth;

use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Verified;

class VerifyController extends Controller
{
    public function send(Request $request) {
        $data = $request->validate([
            'email' => 'required|email'
        ]);
        $user = User::where('email',$data['email']) -> first();
        if ($user) {
            $user->sendEmailVerificationNotification();
            return response(['message' => 'Verification link sent!']);
        } else {
            return response(['error' => 'We can\'t find a user with that email address.'], 404);
        }

    }
    public function verify(Request $request)
    {
        $user = User::find($request->id);
        if (!$user || $request->route('id') != $user->getKey()) {
            return redirect('/callback/error');
        }
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }
        return redirect('/welcome');
    }
}

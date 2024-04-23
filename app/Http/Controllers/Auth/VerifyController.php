<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;

class VerifyController extends Controller
{
    /**
     * Envoi de l'email de vérification du compte
     */
    public function send(Request $request) {
        $data = $request->validate([
            'email' => 'required|email'
        ]);
        $user = User::where('email',$data['email']) -> first();
        if ($user) {
            $user->sendEmailVerificationNotification();
            return response(['message' => __('passwords.sent')]);
        } else {
            return response(['message' => __('passwords.user')], 404);
        }

    }

    /**
     * Aquittement du mail
     */
    public function verify(Request $request)
    {
        $user = User::find($request->id);
        if (!$user || $request->route('id') != $user->getKey()) {
            return redirect('/notfound');
        }
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }
        return redirect('/welcome');
    }
}

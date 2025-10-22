<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

class SocialController extends Controller
{
    /**
     * Verify a Google ID token sent from the frontend, then create or update the user,
     * issue a Sanctum token and return it to the frontend.
     */
    public function googleIdToken(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        $idToken = $request->input('id_token');

        // Verify the ID token using Google's tokeninfo endpoint
        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $idToken,
        ]);

        if (!$response->ok()) {
            return response()->json(['message' => 'Invalid Google token'], 401);
        }

        $payload = $response->json();

        // Validate audience (client ID)
        $clientId = env('GOOGLE_CLIENT_ID');
        if (!$clientId || !isset($payload['aud']) || $payload['aud'] !== $clientId) {
            return response()->json(['message' => 'Token audience mismatch'], 401);
        }

        // Basic checks
        if (!isset($payload['email'])) {
            return response()->json(['message' => 'Email not provided by Google'], 422);
        }

        $emailVerified = isset($payload['email_verified']) && (bool)($payload['email_verified'] === true || $payload['email_verified'] === 'true');

        $googleUserId = $payload['sub'] ?? null;
        $email = $payload['email'];
        $name = $payload['name'] ?? ($payload['given_name'] ?? ($payload['family_name'] ?? (explode('@', $email)[0] ?? '')));
        $avatar = $payload['picture'] ?? null;

        // Create or update the user
        $user = User::where('email', $email)->first();
        $newUser = false;
        if (!$user) {
            $newUser = true;
            $user = new User();
            $user->email = $email;
            $user->name = $name;
            $user->provider_id = $googleUserId;
            $user->avatar = $avatar;
            // Set a random password since Google users won’t use it for login
            $user->password = Hash::make(bin2hex(random_bytes(16)));
            $user->save();
        } else {
            $user->provider_id = $googleUserId;
            if ($name) { $user->name = $name; }
            if ($avatar) { $user->avatar = $avatar; }
            $user->save();
        }

        // Mark email as verified if Google says so
        if ($emailVerified && is_null($user->email_verified_at)) {
            if ($user->markEmailAsVerified()) {
                event(new Verified($user));
            }
        }

        // Authenticate the user for this request context
        Auth::login($user);

        // Issue Sanctum token valid for one week (consistent with existing behavior)
        $token = $user->createToken('diceway', ['*'], now()->addWeek())->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }
}

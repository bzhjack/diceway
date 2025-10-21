<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class GoogleAuthController extends Controller
{
    /**
     * Receive Google ID token from frontend and exchange for local API token.
     */
    public function verify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid request',
                'errors' => $validator->errors(),
            ], 422);
        }

        $idToken = $request->string('id_token');
        $googleClientId = config('services.google.client_id') ?? env('GOOGLE_CLIENT_ID');
        if (!$googleClientId) {
            return response()->json([
                'message' => 'Server misconfigured: GOOGLE_CLIENT_ID is missing',
            ], 500);
        }

        try {
            $client = new Client(['timeout' => 5]);
            // Verify ID token with Google
            $resp = $client->get('https://oauth2.googleapis.com/tokeninfo', [
                'query' => ['id_token' => $idToken],
            ]);
            $payload = json_decode((string)$resp->getBody(), true);
        } catch (\Throwable $e) {
            Log::warning('Google token verification failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Unable to verify token with Google'], 401);
        }

        // Basic checks
        if (!isset($payload['aud']) || $payload['aud'] !== $googleClientId) {
            return response()->json(['message' => 'Invalid token: audience mismatch'], 401);
        }
        if (!isset($payload['email'])) {
            return response()->json(['message' => 'Invalid token: no email'], 401);
        }

        $email = strtolower($payload['email']);
        $name = $payload['name'] ?? ($payload['given_name'] ?? 'Google User');
        $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $googleId = $payload['sub'] ?? null;
        $picture = $payload['picture'] ?? null;

        // Create or get local user
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                // set a random password; not used for Google sign-in
                'password' => bin2hex(random_bytes(16)),
            ]
        );

        // Update profile fields that may change
        $dirty = false;
        if ($googleId && $user->provider_id !== $googleId) { $user->provider_id = $googleId; $dirty = true; }
        if ($picture && $user->avatar !== $picture) { $user->avatar = $picture; $dirty = true; }
        if ($name && $user->name !== $name) { $user->name = $name; $dirty = true; }
        if ($emailVerified && is_null($user->email_verified_at)) { $user->email_verified_at = now(); $dirty = true; }
        if ($dirty) { $user->save(); }

        // Issue Sanctum token
        $token = $user->createToken('google')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}

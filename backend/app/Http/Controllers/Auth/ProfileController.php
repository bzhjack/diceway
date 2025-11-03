<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function profile()
    {
        return Auth::user();
    }
    public function me(Request $request) {
        return $request->user();
    }
    public function show($id)
    {

        $avatarPath = "avatars/{$id}.jpg";
        if (!Storage::disk('public')->exists($avatarPath)) {
            return response()->json(['message' => "Avatar $id not found"], 404);
        }

        $path = Storage::disk('public')->path($avatarPath);
        $mime = mime_content_type($path);

        return response()->file($path, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}

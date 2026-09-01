<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(['data' => $request->user()->tokens()->orderByDesc('last_used_at')->orderByDesc('created_at')->get(['id', 'name', 'created_at', 'last_used_at', 'expires_at'])->map(fn ($token) => [
            'id' => $token->id,
            'name' => $token->name,
            'created_at' => $token->created_at,
            'last_used_at' => $token->last_used_at,
            'expires_at' => $token->expires_at,
            'current' => (int) ($request->user()->currentAccessToken()?->id) === (int) $token->id,
        ])]);
    }

    public function destroy(Request $request, PersonalAccessToken $token)
    {
        abort_unless((int) $token->tokenable_id === (int) $request->user()->id && $token->tokenable_type === $request->user()->getMorphClass(), 404, 'Session not found.');
        $token->delete();
        return response()->json(['message' => 'Session revoked successfully.']);
    }

    public function destroyOthers(Request $request)
    {
        $currentId = $request->user()->currentAccessToken()?->id;
        $query = $request->user()->tokens();
        if ($currentId) {
            $query->whereKeyNot($currentId);
        }
        $revoked = $query->delete();
        return response()->json(['message' => "{$revoked} other session(s) revoked.", 'revoked' => $revoked]);
    }
}

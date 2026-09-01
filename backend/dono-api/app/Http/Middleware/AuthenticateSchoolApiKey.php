<?php

namespace App\Http\Middleware;

use App\Models\SchoolApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateSchoolApiKey
{
    public function handle(Request $request, Closure $next, ?string $requiredScope = null): Response
    {
        $header = (string) $request->header('Authorization');
        $token = str_starts_with($header, 'Bearer ') ? trim(substr($header, 7)) : '';
        if (! str_starts_with($token, 'dono_sk_') || strlen($token) < 40) {
            return response()->json(['message' => 'A valid school API key is required.'], 401);
        }

        $key = SchoolApiKey::where('key_hash', hash('sha256', $token))->whereNull('revoked_at')->first();
        if (! $key || ($key->expires_at && $key->expires_at->isPast())) {
            return response()->json(['message' => 'This school API key is invalid or expired.'], 401);
        }
        if ($requiredScope && ! in_array($requiredScope, (array) $key->scopes, true)) {
            return response()->json(['message' => 'This API key does not have the required scope.'], 403);
        }

        $key->forceFill(['last_used_at' => now()])->saveQuietly();
        $request->attributes->set('school_api_key', $key);
        $request->attributes->set('school_api_key_school_id', (int) $key->school_id);
        return $next($request);
    }
}

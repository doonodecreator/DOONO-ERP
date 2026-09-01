<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateOAuthClient
{
    public function handle(Request $request, Closure $next): Response
    {
        $client = Auth::guard('api')->client();

        if (! $client || $client->revoked || ! $client->school_id) {
            return response()->json(['message' => 'A valid school OAuth client is required.'], 401);
        }

        $request->attributes->set('oauth_client', $client);
        $request->attributes->set('oauth_client_school_id', (int) $client->school_id);

        return $next($request);
    }
}

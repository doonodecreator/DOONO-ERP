<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->must_change_password) {
            return response()->json([
                'message' => 'You must change your temporary password before using the school portal.',
                'code' => 'PASSWORD_CHANGE_REQUIRED',
                'must_change_password' => true,
            ], 403);
        }

        return $next($request);
    }
}

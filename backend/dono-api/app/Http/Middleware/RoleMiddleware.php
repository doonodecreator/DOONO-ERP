<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        foreach ($roles as $role) {
            // 'any' = does the user hold this role at all, regardless of
            // whether it's platform-wide (school_id null) or scoped to a
            // specific school. Route-level gating only cares "can this
            // user ever act as this role" — per-school ownership checks
            // (e.g. "is this YOUR school") happen inside the controller,
            // see SchoolController::userCanAccessSchool().
            if ($user->hasRole($role, 'any')) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Access denied.'
        ], 403);
    }
}

<?php

namespace App\Http\Middleware;

use App\Services\CurrentContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    public function __construct(private readonly CurrentContextService $context)
    {
    }

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($user)?->id;

        if (! $schoolId || ! $user->hasPermission($permission, (int) $schoolId)) {
            return response()->json([
                'message' => 'Forbidden. You do not have the required permission for this school.',
            ], 403);
        }

        return $next($request);
    }
}

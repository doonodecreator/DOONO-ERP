<?php

namespace App\Http\Middleware;

use App\Services\CurrentContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HasSchool
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    /**
     * Handle an incoming request with strict tenant isolation.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Access Denied: Unassigned or invalid school context.',
            ], 403);
        }

        // CurrentContextService is the sole resolver of a user's default school.
        $resolvedSchoolId = $this->context->currentSchool($user)?->id;

        // Platform admins may explicitly select a school for a platform action.
        if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            $requestedSchoolId = $request->header('X-School-Id')
                ?? $request->input('school_id')
                ?? $resolvedSchoolId;

            if ($requestedSchoolId) {
                $request->attributes->set('current_school_id', (int) $requestedSchoolId);
            }

            return $next($request);
        }

        if (! $resolvedSchoolId) {
            return response()->json([
                'success' => false,
                'message' => 'Access Denied: Unassigned or invalid school context.',
            ], 403);
        }

        // Reject user-supplied school IDs that do not match the trusted context.
        if ($request->has('school_id') && (int) $request->input('school_id') !== (int) $resolvedSchoolId) {
            return response()->json([
                'success' => false,
                'message' => 'Security Alert: Cross-tenant data modification attempt blocked.',
            ], 403);
        }

        $request->attributes->set('current_school_id', (int) $resolvedSchoolId);

        return $next($request);
    }
}

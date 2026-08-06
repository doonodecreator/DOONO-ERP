<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HasSchool
{
    /**
     * Handle an incoming request with strict tenant isolation.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // 1. Super Admins hold God-Mode override access across all schools
        if ($user && method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            $requestedSchoolId = $request->header('X-School-Id') 
                ?? $request->input('school_id') 
                ?? $user->currentSchoolId();

            if ($requestedSchoolId) {
                $request->attributes->set('current_school_id', (int) $requestedSchoolId);
            }

            return $next($request);
        }

        // 2. Regular Tenant Users MUST be tied to an authenticated school
        $schoolId = $user ? $user->currentSchoolId() : null;

        if (!$schoolId) {
            return response()->json([
                'success' => false,
                'message' => 'Access Denied: Unassigned or invalid school context.',
            ], 403);
        }

        // 3. Strict Context Override Prevention:
        // Wipe any user-supplied school_id in request bodies to prevent spoofing
        if ($request->has('school_id') && (int) $request->input('school_id') !== (int) $schoolId) {
            return response()->json([
                'success' => false,
                'message' => 'Security Alert: Cross-tenant data modification attempt blocked.',
            ], 403);
        }

        // Lock down current school ID in request attributes
        $request->attributes->set('current_school_id', (int) $schoolId);

        return $next($request);
    }
}

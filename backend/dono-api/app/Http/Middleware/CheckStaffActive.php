<?php

namespace App\Http\Middleware;

use App\Services\CurrentContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckStaffActive
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    /**
     * Handle an incoming request and ensure the staff member is still active in the school.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Platform Super Admins always bypass
        if ($user && method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            return $next($request);
        }

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($user)?->id;

        if (! $schoolId) {
            return $next($request);
        }

        // Check if user is still active in the school's staff records
        $isStaffActive = false;

        $staffRecord = \App\Models\Staff::where('user_id', $user->id)
            ->where('school_id', $schoolId)
            ->first();

        if ($staffRecord) {
            $isStaffActive = property_exists($staffRecord, 'is_active') ? $staffRecord->is_active : true;
        } else {
            if ($this->context->currentSchool($user)?->id === (int) $schoolId) {
                $isStaffActive = true;
            }
        }

        if (! $isStaffActive) {
            // Instantly revoke all active API tokens so they cannot make further requests
            $user->tokens()->delete();

            return response()->json([
                'success' => false,
                'message' => 'You are no longer a staff of this school.',
            ], 403);
        }

        return $next($request);
    }
}

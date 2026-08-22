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

        // A staff record is authoritative for school access. On-leave staff may
        // still sign in, but suspended, retired, resigned, and terminated staff
        // must be blocked immediately. Eloquent attributes are accessed through
        // getAttribute(), not property_exists(), because employment_status is a
        // database column rather than a declared PHP property.
        $staffRecord = \App\Models\Staff::where('user_id', $user->id)
            ->where('school_id', $schoolId)
            ->first();

        $employmentStatus = strtolower(trim((string) $staffRecord?->getAttribute('employment_status')));
        $staffRoleSlugs = [
            'principal', 'vice_principal', 'vice_principal_academic',
            'vice_principal_admin', 'nursery_head', 'primary_head',
            'secondary_head', 'teacher', 'form_teacher', 'bursar',
            'cashier', 'accountant', 'librarian', 'nurse', 'hostel_master',
            'hostel_mistress', 'transport_manager', 'receptionist',
        ];
        $hasStaffRole = $user->roles()
            ->wherePivot('school_id', $schoolId)
            ->whereIn('slug', $staffRoleSlugs)
            ->exists();

        $isStaffActive = $staffRecord
            ? in_array($employmentStatus, ['active', 'on leave', 'on_leave'], true)
            : ! $hasStaffRole && $this->context->currentSchool($user)?->id === (int) $schoolId;

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

<?php

namespace App\Http\Middleware;

use App\Models\School;
use App\Services\CurrentContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function __construct(private readonly CurrentContextService $context)
    {
    }

    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // The only platform-wide role is super_admin. It is intentionally
        // evaluated without a school context.
        if (in_array('super_admin', $roles, true) && $user->isSuperAdmin()) {
            return $next($request);
        }

        // All operational roles must match the trusted current school. Routes
        // inside the has.school group provide this attribute; other role-gated
        // routes resolve it through the same CurrentContextService source.
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($user)?->id;

        if (! $schoolId) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        foreach ($roles as $role) {
            if ($role !== 'super_admin' && $user->hasRole($role, (int) $schoolId)) {
                return $next($request);
            }

            if ($role === 'proprietor' && School::query()
                ->whereKey($schoolId)
                ->where(function ($query) use ($user) {
                    $query->where('owner_id', $user->id)
                        ->orWhereHas('organization', fn ($organization) => $organization->where('owner_id', $user->id));
                })
                ->exists()) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'Access denied.'], 403);
    }
}

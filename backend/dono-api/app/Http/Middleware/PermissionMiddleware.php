<?php

namespace App\Http\Middleware;

use App\Models\Role;
use App\Models\School;
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

        $hasPermission = $schoolId && $user->hasPermission($permission, (int) $schoolId);
        if (! $hasPermission && $schoolId) {
            $isOwnedOrganizationSchool = School::query()
                ->whereKey($schoolId)
                ->where(function ($query) use ($user) {
                    $query->where('owner_id', $user->id)
                        ->orWhereHas('organization', fn ($organization) => $organization->where('owner_id', $user->id));
                })
                ->exists();
            $hasPermission = $isOwnedOrganizationSchool && Role::query()
                ->where('slug', 'proprietor')
                ->whereHas('permissions', fn ($query) => $query->where('slug', $permission))
                ->exists();
        }

        if (! $schoolId || ! $hasPermission) {
            return response()->json([
                'message' => 'Forbidden. You do not have the required permission for this school.',
            ], 403);
        }

        return $next($request);
    }
}

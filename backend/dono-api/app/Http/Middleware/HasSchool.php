<?php

namespace App\Http\Middleware;

use App\Services\CurrentContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HasSchool
{
    public function __construct(private CurrentContextService $context)
    {
    }

    /**
     * Gates any route that requires an active school context.
     * Platform admins bypass this — they operate across all schools.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $resolved = $this->context->resolve($request->user());

        if ($resolved['is_platform_admin']) {
            return $next($request);
        }

        if (!$resolved['school']) {
            return response()->json([
                'success' => false,
                'message' => 'No active school. Complete school setup first.',
                'onboarding_step' => $resolved['onboarding_step'],
            ], 409);
        }

        return $next($request);
    }
}

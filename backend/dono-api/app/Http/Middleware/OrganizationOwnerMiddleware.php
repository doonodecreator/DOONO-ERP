<?php

namespace App\Http\Middleware;

use App\Services\CurrentContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrganizationOwnerMiddleware
{
    public function __construct(private readonly CurrentContextService $context)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $this->context->currentOrganization($user)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        return $next($request);
    }
}

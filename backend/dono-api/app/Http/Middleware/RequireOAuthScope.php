<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Passport\AccessToken;
use Laravel\Passport\Contracts\ScopeAuthorizable;
use League\OAuth2\Server\Exception\OAuthServerException;
use League\OAuth2\Server\ResourceServer;
use Symfony\Bridge\PsrHttpMessage\Factory\PsrHttpFactory;
use Symfony\Component\HttpFoundation\Response;

class RequireOAuthScope
{
    public function __construct(private ResourceServer $server) {}

    public function handle(Request $request, Closure $next, string ...$scopes): Response
    {
        $client = $request->attributes->get('oauth_client');
        $expectedClientId = $client?->getKey();
        if (! $client || ! $expectedClientId) {
            return response()->json(['message' => 'OAuth client authentication is required.'], 401);
        }

        try {
            $psrRequest = (new PsrHttpFactory)->createRequest($request);
            $psrRequest = $this->server->validateAuthenticatedRequest($psrRequest);
            $token = AccessToken::fromPsrRequest($psrRequest);
        } catch (OAuthServerException) {
            return response()->json(['message' => 'The OAuth access token is invalid or expired.'], 401);
        }

        if ((string) ($token->oauth_client_id ?? '') !== (string) $expectedClientId) {
            return response()->json(['message' => 'OAuth client context mismatch.'], 403);
        }

        $requested = array_values(array_filter($scopes));
        if ($requested !== [] && ! $this->hasAnyScope($token, $requested)) {
            return response()->json([
                'message' => 'The OAuth access token does not include a required scope.',
                'required_scopes' => $requested,
            ], 403);
        }

        $request->attributes->set('oauth_access_token', $token);

        return $next($request);
    }

    private function hasAnyScope(ScopeAuthorizable $token, array $scopes): bool
    {
        foreach ($scopes as $scope) {
            if ($token->can($scope)) {
                return true;
            }
        }

        return false;
    }
}

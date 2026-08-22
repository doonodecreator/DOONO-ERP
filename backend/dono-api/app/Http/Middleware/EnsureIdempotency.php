<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class EnsureIdempotency
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array(strtoupper($request->method()), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $next($request);
        }

        $key = trim((string) $request->header('Idempotency-Key'));
        if ($key === '') {
            return $next($request);
        }

        if (strlen($key) > 200) {
            return response()->json(['message' => 'Idempotency-Key must not exceed 200 characters.'], 422);
        }

        $fingerprint = hash('sha256', implode('|', [
            $request->user()?->getAuthIdentifier() ?? $request->ip(),
            strtoupper($request->method()),
            $request->path(),
            $key,
        ]));
        $cacheKey = 'idempotency:response:'.$fingerprint;
        $lockKey = 'idempotency:lock:'.$fingerprint;

        if ($cached = Cache::get($cacheKey)) {
            return response($cached['content'], $cached['status'], $cached['headers'] ?? [])
                ->header('Idempotent-Replayed', 'true');
        }

        $lock = Cache::lock($lockKey, 15);
        if (! $lock->get()) {
            return response()->json(['message' => 'This request is already being processed. Retry with the same Idempotency-Key.'], 409);
        }

        try {
            if ($cached = Cache::get($cacheKey)) {
                return response($cached['content'], $cached['status'], $cached['headers'] ?? [])
                    ->header('Idempotent-Replayed', 'true');
            }

            $response = $next($request);
            if ($response->isSuccessful() || $response->isRedirection()) {
                $content = $response->getContent();
                if ($content !== false) {
                    Cache::put($cacheKey, [
                        'content' => $content,
                        'status' => $response->getStatusCode(),
                        'headers' => ['Content-Type' => $response->headers->get('Content-Type', 'application/json')],
                    ], now()->addHours(24));
                }
            }

            return $response;
        } finally {
            optional($lock)->release();
        }
    }
}

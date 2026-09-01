<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AttachRequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $incoming = trim((string) $request->header('X-Request-ID', ''));
        $requestId = preg_match('/^[A-Za-z0-9._:-]{8,120}$/', $incoming) ? $incoming : (string) Str::uuid();

        $request->attributes->set('request_id', $requestId);
        Log::withContext(['request_id' => $requestId]);

        $startedAt = hrtime(true);
        $response = $next($request);
        $durationMs = round((hrtime(true) - $startedAt) / 1_000_000, 2);
        $response->headers->set('X-Request-ID', $requestId);
        $response->headers->set('X-Response-Time-ms', (string) $durationMs);
        if ($durationMs >= (float) env('SLOW_REQUEST_MS', 1000)) {
            Log::warning('Slow HTTP request', [
                'method' => $request->method(),
                'path' => $request->path(),
                'status' => $response->getStatusCode(),
                'duration_ms' => $durationMs,
            ]);
        }

        return $response;
    }
}

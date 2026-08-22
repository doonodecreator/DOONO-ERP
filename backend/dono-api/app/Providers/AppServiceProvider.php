<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Infrastructure services are resolved by Laravel's container.
    }

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            $identity = $request->user()?->getAuthIdentifier() ?? $request->ip();
            return Limit::perMinute((int) config('dono.rate_limits.api_per_minute', 120))->by('api:'.$identity);
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute((int) config('dono.rate_limits.auth_per_minute', 10))->by('auth:'.strtolower(trim((string) $request->input('email'))).'|'.$request->ip());
        });
    }
}

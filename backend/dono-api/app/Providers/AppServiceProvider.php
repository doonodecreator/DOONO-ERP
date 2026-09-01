<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Carbon\CarbonInterval;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if (class_exists(Passport::class)) {
            if (config('dono.oauth.enabled')) {
                Passport::useClientModel(\App\Models\Passport\Client::class);
            } else {
                Passport::ignoreRoutes();
            }
        }
    }

    public function boot(): void
    {
        if (config('dono.oauth.enabled') && class_exists(Passport::class)) {
            Passport::tokensCan([
                'school.read' => 'Read the authenticated school profile.',
                'students.read' => 'Read active student directory records for one school.',
                'fees.read' => 'Read student fee and invoice summaries for one school.',
                'fees.write' => 'Record verified fee payments for one school.',
                'attendance.write' => 'Create or correct attendance records for one school.',
            ]);
            Passport::clientCredentialsTokensExpireIn(
                CarbonInterval::minutes(max((int) env('OAUTH_CLIENT_TOKEN_MINUTES', 60), 5))
            );
        }

        RateLimiter::for('api', function (Request $request) {
            $identity = $request->attributes->get('oauth_client')?->getKey()
                ?? $request->user()?->getAuthIdentifier()
                ?? $request->ip();
            return Limit::perMinute((int) config('dono.rate_limits.api_per_minute', 120))->by('api:'.$identity);
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute((int) config('dono.rate_limits.auth_per_minute', 10))->by('auth:'.strtolower(trim((string) $request->input('email'))).'|'.$request->ip());
        });
    }
}

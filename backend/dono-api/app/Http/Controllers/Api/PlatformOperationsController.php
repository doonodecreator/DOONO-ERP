<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PlatformOperationsController extends Controller
{
    public function health()
    {
        $databaseStatus = 'down';
        try {
            DB::select('select 1');
            $databaseStatus = 'up';
        } catch (\Throwable) {
            // Keep the response safe and useful to the platform owner.
        }

        $cacheStatus = 'unknown';
        try {
            $key = 'platform_health_probe';
            Cache::put($key, 'ok', now()->addSeconds(10));
            $cacheStatus = Cache::get($key) === 'ok' ? 'up' : 'down';
        } catch (\Throwable) {
            $cacheStatus = 'down';
        }

        $queueDriver = (string) config('queue.default', 'unknown');
        $queueStatus = $queueDriver === 'sync' ? 'configured' : ($queueDriver ? 'configured' : 'unknown');
        $schedulerHeartbeat = Cache::get('dono:scheduler:heartbeat');
        $schedulerStatus = 'unknown';
        if ($schedulerHeartbeat) {
            try {
                $heartbeatAt = \Illuminate\Support\Carbon::parse($schedulerHeartbeat);
                $schedulerStatus = $heartbeatAt->between(now()->subHours(26), now()) ? 'up' : 'stale';
            } catch (\Throwable) {
                $schedulerStatus = 'invalid';
            }
        }

        return response()->json([
            'data' => [
                'application' => ['status' => 'up'],
                'database' => ['status' => $databaseStatus],
                'cache' => ['status' => $cacheStatus, 'driver' => (string) config('cache.default', 'unknown')],
                'queue' => ['status' => $queueStatus, 'driver' => $queueDriver],
                'scheduler' => ['status' => $schedulerStatus, 'last_heartbeat' => $schedulerHeartbeat],
                'storage' => ['status' => is_writable(storage_path()) ? 'writable' : 'not_writable'],
                'migrations_table' => ['status' => Schema::hasTable('migrations') ? 'true' : 'false'],
                'checked_at' => ['status' => now()->toIso8601String()],
            ],
        ]);
    }
}

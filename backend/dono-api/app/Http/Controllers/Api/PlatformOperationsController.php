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
        $pendingJobs = null;
        $failedJobs = null;
        try {
            $pendingJobs = Schema::hasTable('jobs') ? DB::table('jobs')->count() : null;
            $failedJobs = Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->count() : null;
        } catch (\Throwable) {
            // Queue metrics are diagnostic only and must never break the health endpoint.
        }
        $workerHeartbeat = Cache::get('dono:queue:heartbeat');
        $workerStatus = 'unknown';
        if ($workerHeartbeat) {
            try {
                $workerAt = \Illuminate\Support\Carbon::parse($workerHeartbeat);
                $workerStatus = $workerAt->between(now()->subMinutes(10), now()) ? 'up' : 'stale';
            } catch (\Throwable) {
                $workerStatus = 'invalid';
            }
        }
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
                'queue' => ['status' => $queueStatus, 'driver' => $queueDriver, 'pending_jobs' => $pendingJobs, 'failed_jobs' => $failedJobs, 'worker_status' => $workerStatus, 'worker_last_heartbeat' => $workerHeartbeat],
                'scheduler' => ['status' => $schedulerStatus, 'last_heartbeat' => $schedulerHeartbeat],
                'storage' => ['status' => is_writable(storage_path()) ? 'writable' : 'not_writable'],
                'migrations_table' => ['status' => Schema::hasTable('migrations') ? 'true' : 'false'],
                'checked_at' => ['status' => now()->toIso8601String()],
            ],
        ]);
    }
}

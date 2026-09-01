<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Commands
|--------------------------------------------------------------------------
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
*/

Schedule::command('subscriptions:expire')
    ->dailyAt('00:00')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('subscriptions:reminders')
    ->dailyAt('00:30')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('insights:snapshot --days=30')
    ->dailyAt('01:00')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('support:mark-sla-breaches')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();

if ((bool) env('BACKUP_SCHEDULE_ENABLED', false)) {
    Schedule::command('dono:backup')
        ->dailyAt('02:00')
        ->withoutOverlapping()
        ->onOneServer();
}

if ((bool) env('BACKUP_RETENTION_ENABLED', false)) {
    $retentionDays = max(1, min((int) env('BACKUP_RETENTION_DAYS', 30), 3650));
    Schedule::command('dono:backup:prune --days='.$retentionDays)
        ->dailyAt('03:00')
        ->withoutOverlapping()
        ->onOneServer();
}

Schedule::command('live-rooms:purge-recordings')
    ->dailyAt('02:30')
    ->withoutOverlapping()
    ->onOneServer();

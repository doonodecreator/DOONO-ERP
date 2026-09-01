<?php

namespace App\Console\Commands;

use App\Models\BackupRun;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

class PruneEncryptedBackups extends Command
{
    protected $signature = 'dono:backup:prune
        {--days= : Retain succeeded backups for this many days; defaults to BACKUP_RETENTION_DAYS}
        {--dry-run : Report eligible backups without deleting encrypted objects}';

    protected $description = 'Expire encrypted backup objects beyond the explicitly configured retention period.';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: env('BACKUP_RETENTION_DAYS', 30));
        if ($days < 1 || $days > 3650) {
            $this->error('Retention days must be between 1 and 3650.');
            return self::FAILURE;
        }

        $runs = BackupRun::query()
            ->where('status', 'succeeded')
            ->whereNotNull('completed_at')
            ->where('completed_at', '<', now()->subDays($days))
            ->orderBy('id')
            ->get();

        if ($this->option('dry-run')) {
            $this->info("{$runs->count()} encrypted backup(s) are eligible for expiration after {$days} day(s).");
            return self::SUCCESS;
        }

        $failures = 0;
        foreach ($runs as $run) {
            try {
                $storage = Storage::disk($run->disk);
                if ($run->path && $storage->exists($run->path) && ! $storage->delete($run->path)) {
                    throw new \RuntimeException('The encrypted object could not be deleted.');
                }

                $run->forceFill([
                    'status' => 'expired',
                    'path' => null,
                    'failure_message' => "Encrypted artifact expired after {$days} day(s) by retention policy.",
                ])->save();
                $this->line("Expired backup run {$run->id}.");
            } catch (Throwable $exception) {
                $failures++;
                report($exception);
                $this->error("Backup run {$run->id} was not expired: {$exception->getMessage()}");
            }
        }

        return $failures > 0 ? self::FAILURE : self::SUCCESS;
    }
}


<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use RuntimeException;

class VerifyEncryptedBackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(public int $backupRunId) {}

    public function handle(): void
    {
        $exitCode = Artisan::call('dono:backup:verify', [
            'backupRun' => $this->backupRunId,
        ]);
        if ($exitCode !== 0) {
            throw new RuntimeException(Artisan::output() ?: 'Encrypted backup verification failed.');
        }
    }
}


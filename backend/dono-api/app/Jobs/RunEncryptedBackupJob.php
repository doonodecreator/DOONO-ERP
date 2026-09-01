<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;

class RunEncryptedBackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(public ?int $initiatedBy = null) {}

    public function handle(): void
    {
        $arguments = $this->initiatedBy ? ['--initiated-by' => $this->initiatedBy] : [];
        $exitCode = Artisan::call('dono:backup', $arguments);
        if ($exitCode !== 0) {
            throw new \RuntimeException(Artisan::output() ?: 'Encrypted backup command failed.');
        }
    }
}

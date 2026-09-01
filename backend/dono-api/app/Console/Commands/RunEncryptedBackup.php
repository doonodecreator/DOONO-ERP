<?php

namespace App\Console\Commands;

use App\Models\BackupRun;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

class RunEncryptedBackup extends Command
{
    protected $signature = 'dono:backup
        {--disk= : Private filesystem disk; defaults to BACKUP_DISK or local}
        {--initiated-by= : Platform user ID that requested this backup}
        {--dry-run : Validate configuration and binaries without writing a backup}';

    protected $description = 'Create and store an encrypted database backup without retaining plaintext dump files.';

    public function handle(): int
    {
        $disk = trim((string) ($this->option('disk') ?: env('BACKUP_DISK', 'local')));
        $passphrase = (string) env('BACKUP_ENCRYPTION_PASSPHRASE', '');
        $connection = (string) config('database.default');

        try {
            $this->validateConfiguration($disk, $passphrase, $connection);
            if ($this->option('dry-run')) {
                $this->info("Backup configuration is valid for {$connection} on disk {$disk}.");
                return self::SUCCESS;
            }

            $initiatedBy = $this->option('initiated-by');
            if ($initiatedBy !== null && (! is_numeric($initiatedBy) || (int) $initiatedBy < 1)) {
                throw new \RuntimeException('The --initiated-by option must be a positive user ID.');
            }

            $run = BackupRun::create([
                'status' => 'running',
                'disk' => $disk,
                'initiated_by' => $initiatedBy !== null ? (int) $initiatedBy : null,
                'started_at' => now(),
            ]);

            $workDir = storage_path('app/private/backup-work');
            if (! is_dir($workDir) && ! mkdir($workDir, 0700, true) && ! is_dir($workDir)) {
                throw new \RuntimeException('Unable to create the private backup work directory.');
            }

            $base = $workDir.'/dono-'.$run->id.'-'.bin2hex(random_bytes(8));
            $compressedPath = $base.'.sql.gz';
            $encryptedPath = $base.'.sql.gz.gpg';

            try {
                $this->dumpDatabase($connection, $compressedPath);
                $this->encrypt($compressedPath, $encryptedPath, $passphrase);

                $remotePath = 'backups/'.now('UTC')->format('Y/m/d').'/'.$run->id.'-'.now('UTC')->format('His').'.sql.gz.gpg';
                $stream = fopen($encryptedPath, 'rb');
                if ($stream === false || ! Storage::disk($disk)->put($remotePath, $stream)) {
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                    throw new \RuntimeException('The encrypted backup could not be written to the configured private disk.');
                }
                fclose($stream);

                $run->forceFill([
                    'status' => 'succeeded',
                    'path' => $remotePath,
                    'bytes' => filesize($encryptedPath) ?: null,
                    'sha256' => hash_file('sha256', $encryptedPath),
                    'completed_at' => now(),
                ])->save();
                $this->info("Encrypted backup stored at {$remotePath}.");
            } finally {
                @unlink($compressedPath);
                @unlink($encryptedPath);
            }

            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            if (isset($run)) {
                $run->forceFill([
                    'status' => 'failed',
                    'failure_message' => substr($exception->getMessage(), 0, 2000),
                    'completed_at' => now(),
                ])->save();
            }
            $this->error($exception->getMessage());
            return self::FAILURE;
        }
    }

    private function validateConfiguration(string $disk, string $passphrase, string $connection): void
    {
        if (! config("filesystems.disks.{$disk}")) {
            throw new \RuntimeException("Backup disk [{$disk}] is not configured.");
        }
        if (strlen($passphrase) < 16) {
            throw new \RuntimeException('BACKUP_ENCRYPTION_PASSPHRASE must be at least 16 characters and must be supplied as a secret.');
        }
        if (! in_array($connection, ['mysql', 'pgsql'], true)) {
            throw new \RuntimeException("Database connection [{$connection}] is not supported by the encrypted backup command.");
        }
        $binary = $connection === 'mysql' ? env('BACKUP_MYSQLDUMP_BINARY', 'mysqldump') : env('BACKUP_PG_DUMP_BINARY', 'pg_dump');
        if (! $this->binaryAvailable((string) $binary)) {
            throw new \RuntimeException("Required database dump binary [{$binary}] is not available on the worker.");
        }
        if (! $this->binaryAvailable((string) env('BACKUP_GPG_BINARY', 'gpg'))) {
            throw new \RuntimeException('The configured GPG binary is not available on the worker.');
        }
    }

    private function dumpDatabase(string $connection, string $outputPath): void
    {
        $config = (array) config("database.connections.{$connection}");
        $binary = (string) ($connection === 'mysql' ? env('BACKUP_MYSQLDUMP_BINARY', 'mysqldump') : env('BACKUP_PG_DUMP_BINARY', 'pg_dump'));
        $command = $connection === 'mysql'
            ? [$binary, '--host='.(string) ($config['host'] ?? '127.0.0.1'), '--port='.(string) ($config['port'] ?? 3306), '--user='.(string) ($config['username'] ?? ''), '--single-transaction', '--quick', '--routines', '--events', '--triggers', (string) ($config['database'] ?? '')]
            : [$binary, '--host='.(string) ($config['host'] ?? '127.0.0.1'), '--port='.(string) ($config['port'] ?? 5432), '--username='.(string) ($config['username'] ?? ''), '--format=plain', '--no-owner', '--no-privileges', (string) ($config['database'] ?? '')];
        $environment = $connection === 'mysql'
            ? ['MYSQL_PWD' => (string) ($config['password'] ?? '')]
            : ['PGPASSWORD' => (string) ($config['password'] ?? '')];

        $this->runProcess($command, $outputPath, $environment);
    }

    private function encrypt(string $inputPath, string $outputPath, string $passphrase): void
    {
        $this->runProcess(
            [(string) env('BACKUP_GPG_BINARY', 'gpg'), '--batch', '--yes', '--pinentry-mode', 'loopback', '--symmetric', '--cipher-algo', 'AES256', '--passphrase-fd', '0', '--output', $outputPath, $inputPath],
            null,
            [],
            $passphrase."\n",
        );
    }

    private function runProcess(array $command, ?string $stdoutPath, array $environment = [], string $stdin = ''): void
    {
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => $stdoutPath ? ['file', $stdoutPath, 'w'] : ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];
        $processEnvironment = getenv();
        $processEnvironment = is_array($processEnvironment) ? array_merge($processEnvironment, $environment) : ($environment ?: null);
        $process = proc_open($command, $descriptors, $pipes, base_path(), $processEnvironment);
        if (! is_resource($process)) {
            throw new \RuntimeException('Unable to start backup process.');
        }

        if ($stdin !== '') {
            fwrite($pipes[0], $stdin);
        }
        fclose($pipes[0]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        if (! $stdoutPath) {
            stream_get_contents($pipes[1]);
            fclose($pipes[1]);
        }
        $exitCode = proc_close($process);
        if ($exitCode !== 0) {
            throw new \RuntimeException('Backup process failed: '.substr(trim((string) $stderr), 0, 2000));
        }
    }

    private function binaryAvailable(string $binary): bool
    {
        if (str_contains($binary, '/')) {
            return is_executable($binary);
        }

        $result = shell_exec('command -v '.escapeshellarg($binary).' 2>/dev/null');
        return is_string($result) && trim($result) !== '';
    }
}

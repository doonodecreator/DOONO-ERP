<?php

namespace App\Console\Commands;

use App\Models\BackupRun;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class VerifyEncryptedBackup extends Command
{
    protected $signature = 'dono:backup:verify
        {backupRun : Backup run ID to verify}
        {--disk= : Override the disk recorded on the backup run}';

    protected $description = 'Verify an encrypted backup checksum and decryptability without writing plaintext output.';

    public function handle(): int
    {
        $localPath = null;

        try {
            $run = BackupRun::query()->findOrFail((int) $this->argument('backupRun'));
            if ($run->status !== 'succeeded' || ! $run->path) {
                throw new RuntimeException('Only a succeeded backup run with a stored encrypted path can be verified.');
            }

            $disk = trim((string) ($this->option('disk') ?: $run->disk));
            $passphrase = (string) env('BACKUP_ENCRYPTION_PASSPHRASE', '');
            $gpg = (string) env('BACKUP_GPG_BINARY', 'gpg');
            if (strlen($passphrase) < 16) {
                throw new RuntimeException('BACKUP_ENCRYPTION_PASSPHRASE must be at least 16 characters.');
            }
            if (! config("filesystems.disks.{$disk}")) {
                throw new RuntimeException("Backup disk [{$disk}] is not configured.");
            }
            if (! $this->binaryAvailable($gpg)) {
                throw new RuntimeException("The configured GPG binary [{$gpg}] is not available.");
            }

            $storage = Storage::disk($disk);
            if (! $storage->exists($run->path)) {
                throw new RuntimeException('The encrypted backup object does not exist on the configured disk.');
            }

            $source = $storage->readStream($run->path);
            if (! is_resource($source)) {
                throw new RuntimeException('The encrypted backup object could not be opened for verification.');
            }

            $workDir = storage_path('app/private/backup-work');
            if (! is_dir($workDir) && ! mkdir($workDir, 0700, true) && ! is_dir($workDir)) {
                fclose($source);
                throw new RuntimeException('Unable to create the private verification directory.');
            }
            $localPath = $workDir.'/verify-'.$run->id.'-'.bin2hex(random_bytes(8)).'.sql.gz.gpg';
            $target = fopen($localPath, 'wb');
            if (! is_resource($target)) {
                fclose($source);
                throw new RuntimeException('Unable to create the private verification file.');
            }
            stream_copy_to_stream($source, $target);
            fclose($source);
            fclose($target);
            @chmod($localPath, 0600);

            $sha256 = hash_file('sha256', $localPath);
            if (! hash_equals((string) $run->sha256, (string) $sha256)) {
                throw new RuntimeException('Encrypted backup checksum does not match the recorded checksum.');
            }

            $this->verifyDecryption($gpg, $localPath, $passphrase);
            $this->info("Backup run {$run->id} checksum and encrypted payload verified; no plaintext was retained.");
            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $this->error($exception->getMessage());
            return self::FAILURE;
        } finally {
            if ($localPath) {
                @unlink($localPath);
            }
        }
    }

    private function verifyDecryption(string $gpg, string $encryptedPath, string $passphrase): void
    {
        $process = proc_open(
            [$gpg, '--batch', '--yes', '--pinentry-mode', 'loopback', '--passphrase-fd', '0', '--decrypt', '--output', '/dev/null', $encryptedPath],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
            base_path(),
        );
        if (! is_resource($process)) {
            throw new RuntimeException('Unable to start the GPG verification process.');
        }

        fwrite($pipes[0], $passphrase."\n");
        fclose($pipes[0]);
        stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
        if ($exitCode !== 0) {
            throw new RuntimeException('GPG could not decrypt the encrypted backup: '.substr(trim((string) $stderr), 0, 2000));
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


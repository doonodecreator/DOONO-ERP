<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckDonoReadiness extends Command
{
    protected $signature = 'dono:readiness';

    protected $description = 'Report local and deployment prerequisites for DOONO integrations and operations.';

    public function handle(): int
    {
        $failures = 0;
        $warnings = 0;
        $oauthEnabled = (bool) config('dono.oauth.enabled');
        $backupEnabled = (bool) env('BACKUP_SCHEDULE_ENABLED', false) || (bool) env('BACKUP_RETENTION_ENABLED', false);

        $this->line('<info>DOONO De Creator ERP readiness</info>');
        $this->check('Sodium extension', extension_loaded('sodium'), true, $failures, $warnings);
        $this->check('Passport package', class_exists(\Laravel\Passport\Passport::class), $oauthEnabled, $failures, $warnings);
        $this->check('Queue is asynchronous', ! in_array((string) config('queue.default'), ['sync', ''], true), app()->environment('production'), $failures, $warnings);
        $this->check('Private filesystem disk configured', (bool) config('filesystems.disks.'.env('FILESYSTEM_DISK', 'local')), false, $failures, $warnings);

        if ($oauthEnabled) {
            $this->check('OAuth private key', $this->hasValue(config('passport.private_key')), true, $failures, $warnings);
            $this->check('OAuth public key', $this->hasValue(config('passport.public_key')), true, $failures, $warnings);
        } else {
            $this->line('  <comment>OAuth feature switch: disabled (Sanctum remains active).</comment>');
        }

        $twilio = (array) config('services.twilio', []);
        $twilioReady = $this->hasValue($twilio['account_sid'] ?? null)
            && $this->hasValue($twilio['auth_token'] ?? null)
            && ($this->hasValue($twilio['from'] ?? null) || $this->hasValue($twilio['messaging_service_sid'] ?? null))
            && $this->hasValue($twilio['status_callback_url'] ?? null)
            && $this->hasValue($twilio['webhook_url'] ?? null);
        $this->check('Twilio delivery and callback configuration', $twilioReady, false, $failures, $warnings);

        $firebase = (array) config('services.firebase', []);
        $firebaseReady = $this->hasValue($firebase['project_id'] ?? null)
            && ($this->hasValue($firebase['service_account_json'] ?? null) || $this->hasValue($firebase['service_account_path'] ?? null));
        $this->check('Firebase push configuration', $firebaseReady, false, $failures, $warnings);

        if ($backupEnabled) {
            $backupDisk = (string) env('BACKUP_DISK', env('FILESYSTEM_DISK', 'local'));
            $connection = (string) config('database.default');
            $dumpBinary = $connection === 'pgsql' ? env('BACKUP_PG_DUMP_BINARY', 'pg_dump') : env('BACKUP_MYSQLDUMP_BINARY', 'mysqldump');
            $this->check('Backup passphrase', strlen((string) env('BACKUP_ENCRYPTION_PASSPHRASE', '')) >= 16, true, $failures, $warnings);
            $this->check('Backup disk configured', (bool) config("filesystems.disks.{$backupDisk}"), true, $failures, $warnings);
            $this->check('Database dump binary', $this->binaryAvailable((string) $dumpBinary), true, $failures, $warnings);
            $this->check('GPG binary', $this->binaryAvailable((string) env('BACKUP_GPG_BINARY', 'gpg')), true, $failures, $warnings);
        } else {
            $this->line('  <comment>Backup schedule/retention: disabled.</comment>');
        }

        if ($failures > 0) {
            $this->error("Readiness failed with {$failures} blocking check(s) and {$warnings} warning(s).");
            return self::FAILURE;
        }
        $this->info("Readiness passed with {$warnings} warning(s). Unconfigured optional providers are reported as warnings, not silently treated as live.");
        return self::SUCCESS;
    }

    private function check(string $label, bool $ready, bool $required, int &$failures, int &$warnings): void
    {
        if ($ready) {
            $this->line("  <info>[OK]</info> {$label}");
            return;
        }
        if ($required) {
            $failures++;
            $this->line("  <error>[FAIL]</error> {$label}");
            return;
        }
        $warnings++;
        $this->line("  <comment>[WARN]</comment> {$label} (not configured)");
    }

    private function hasValue(mixed $value): bool
    {
        return is_string($value) && trim($value) !== '';
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


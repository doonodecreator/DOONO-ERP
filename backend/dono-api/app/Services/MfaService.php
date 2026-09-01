<?php

namespace App\Services;

use App\Models\MfaChallenge;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MfaService
{
    public function generateSecret(): string
    {
        return $this->base32Encode(random_bytes(20));
    }

    public function provisioningUri(User $user, string $secret): string
    {
        $issuer = rawurlencode((string) config('app.name', 'DOONO De Creator ERP'));
        $label = rawurlencode($issuer.':'.$user->email);
        return "otpauth://totp/{$label}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";
    }

    public function verifyCode(string $secret, string $code, int $window = 1): bool
    {
        $normalized = preg_replace('/\D+/', '', $code) ?: '';
        if (strlen($normalized) !== 6) {
            return false;
        }
        $counter = (int) floor(time() / 30);
        for ($offset = -$window; $offset <= $window; $offset++) {
            $binaryCounter = pack('N*', 0).pack('N*', $counter + $offset);
            $hash = hash_hmac('sha1', $binaryCounter, $this->base32Decode($secret), true);
            $index = ord($hash[19]) & 0x0f;
            $value = ((ord($hash[$index]) & 0x7f) << 24)
                | ((ord($hash[$index + 1]) & 0xff) << 16)
                | ((ord($hash[$index + 2]) & 0xff) << 8)
                | (ord($hash[$index + 3]) & 0xff);
            if (hash_equals(str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT), $normalized)) {
                return true;
            }
        }
        return false;
    }

    public function recoveryCodes(): array
    {
        return array_map(fn () => strtoupper(Str::random(4).'-'.Str::random(4)), range(1, 8));
    }

    public function hashRecoveryCodes(array $codes): array
    {
        return array_map(fn (string $code) => Hash::make(strtoupper(trim($code))), $codes);
    }

    public function consumeRecoveryCode(User $user, string $code): bool
    {
        $codes = is_array($user->mfa_recovery_codes) ? $user->mfa_recovery_codes : [];
        $normalized = strtoupper(trim($code));
        foreach ($codes as $index => $hash) {
            if (is_string($hash) && Hash::check($normalized, $hash)) {
                unset($codes[$index]);
                $user->mfa_recovery_codes = array_values($codes);
                return true;
            }
        }
        return false;
    }

    public function issueChallenge(User $user, ?string $ip, ?string $userAgent): string
    {
        $raw = Str::random(64);
        MfaChallenge::where('user_id', $user->id)->whereNull('used_at')->update(['used_at' => now()]);
        MfaChallenge::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $raw),
            'expires_at' => now()->addMinutes(10),
            'ip_address' => $ip,
            'user_agent' => $userAgent,
        ]);
        return $raw;
    }

    public function challenge(string $rawToken): ?MfaChallenge
    {
        return MfaChallenge::with('user')
            ->where('token_hash', hash('sha256', $rawToken))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    private function base32Encode(string $input): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';
        foreach (unpack('C*', $input) as $byte) {
            $bits .= str_pad(decbin($byte), 8, '0', STR_PAD_LEFT);
        }
        $output = '';
        foreach (str_split($bits, 5) as $chunk) {
            $output .= $alphabet[bindec(str_pad($chunk, 5, '0'))];
        }
        return $output;
    }

    private function base32Decode(string $input): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';
        foreach (str_split(strtoupper(trim($input))) as $character) {
            $position = strpos($alphabet, $character);
            if ($position === false) continue;
            $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }
        $output = '';
        foreach (str_split($bits, 8) as $chunk) {
            if (strlen($chunk) === 8) $output .= chr(bindec($chunk));
        }
        return $output;
    }
}

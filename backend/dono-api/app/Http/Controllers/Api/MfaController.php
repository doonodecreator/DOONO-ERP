<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MfaChallenge;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\MfaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class MfaController extends Controller
{
    public function __construct(private MfaService $mfa, private CurrentContextService $context) {}

    public function status(Request $request)
    {
        $user = $request->user();
        return response()->json(['data' => [
            'enabled' => (bool) $user->mfa_enabled,
            'confirmed_at' => $user->mfa_confirmed_at,
            'recovery_codes_remaining' => count(is_array($user->mfa_recovery_codes) ? $user->mfa_recovery_codes : []),
        ]]);
    }

    public function setup(Request $request)
    {
        $user = $request->user();
        abort_if($user->mfa_enabled, 409, 'MFA is already enabled. Disable it before creating a new authenticator setup.');
        $secret = $this->mfa->generateSecret();
        $user->mfa_secret = $secret;
        $user->mfa_confirmed_at = null;
        $user->save();
        return response()->json(['data' => [
            'secret' => $secret,
            'otpauth_uri' => $this->mfa->provisioningUri($user, $secret),
            'expires_in_minutes' => 15,
        ]]);
    }

    public function confirm(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'digits:6']]);
        $user = $request->user();
        abort_unless($user->mfa_secret, 409, 'Start MFA setup before confirming an authenticator code.');
        abort_if($user->mfa_enabled, 409, 'MFA is already enabled.');
        abort_unless($this->mfa->verifyCode($user->mfa_secret, $data['code']), 422, 'The authenticator code is invalid or expired.');

        $recoveryCodes = $this->mfa->recoveryCodes();
        $user->forceFill([
            'mfa_enabled' => true,
            'mfa_confirmed_at' => now(),
            'mfa_recovery_codes' => $this->mfa->hashRecoveryCodes($recoveryCodes),
        ])->save();
        ActivityLogService::log('security', 'mfa_enabled', 'Multi-factor authentication was enabled.', $user, [], $this->context->currentSchool($user)?->id);
        return response()->json(['message' => 'MFA enabled. Store these recovery codes somewhere safe; they are shown only once.', 'data' => ['recovery_codes' => $recoveryCodes]]);
    }

    public function disable(Request $request)
    {
        $data = $request->validate(['current_password' => ['required', 'string'], 'code' => ['required', 'string', 'max:32']]);
        $user = $request->user();
        abort_unless($user->mfa_enabled, 409, 'MFA is not enabled.');
        abort_unless(Hash::check($data['current_password'], $user->password), 422, 'The current password is incorrect.');
        $valid = $this->mfa->verifyCode((string) $user->mfa_secret, $data['code']) || $this->mfa->consumeRecoveryCode($user, $data['code']);
        abort_unless($valid, 422, 'The authenticator or recovery code is invalid.');
        $user->forceFill(['mfa_enabled' => false, 'mfa_secret' => null, 'mfa_recovery_codes' => null, 'mfa_confirmed_at' => null])->save();
        ActivityLogService::log('security', 'mfa_disabled', 'Multi-factor authentication was disabled after password and code verification.', $user, [], $this->context->currentSchool($user)?->id);
        return response()->json(['message' => 'MFA disabled.']);
    }

    public function verify(Request $request)
    {
        $data = $request->validate(['challenge_token' => ['required', 'string', 'min:40', 'max:100'], 'code' => ['required', 'string', 'max:32']]);
        $challenge = DB::transaction(function () use ($data, $request) {
            $challenge = MfaChallenge::with('user')->where('token_hash', hash('sha256', $data['challenge_token']))->whereNull('used_at')->lockForUpdate()->first();
            if (! $challenge || $challenge->expires_at->isPast() || $challenge->attempts >= 5) {
                throw ValidationException::withMessages(['code' => ['This MFA challenge is invalid, expired, or locked. Start sign-in again.']]);
            }
            $user = $challenge->user;
            $valid = $this->mfa->verifyCode((string) $user->mfa_secret, $data['code']);
            if (! $valid) {
                $valid = $this->mfa->consumeRecoveryCode($user, $data['code']);
            }
            if (! $valid) {
                $challenge->increment('attempts');
                throw ValidationException::withMessages(['code' => ['The authenticator or recovery code is invalid.']]);
            }
            $user->forceFill(['mfa_last_used_at' => now()])->save();
            $challenge->update(['used_at' => now()]);
            return $challenge->fresh(['user']);
        });

        $user = $challenge->user;
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;
        ActivityLogService::log('security', 'mfa_verified', 'MFA was verified during sign-in.', $user, [], $this->context->currentSchool($user)?->id);
        return response()->json(['message' => 'MFA verified.', 'token' => $token, ...$this->context->resolve($user)]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\EmailVerificationService;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    public function __construct(private EmailVerificationService $verification) {}

    public function verify(Request $request, int $id, string $hash)
    {
        abort_unless($request->hasValidSignature(false), 403, 'This verification link is invalid or expired.');
        $user = User::findOrFail($id);
        abort_unless(hash_equals($hash, sha1($user->getEmailForVerification())), 403, 'This verification link is invalid.');

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        $frontendUrl = $this->publicFrontendUrl($request);
        return redirect()->away($frontendUrl.'/email-verified?verified=1');
    }

    private function publicFrontendUrl(Request $request): string
    {
        $configured = rtrim(trim((string) env('FRONTEND_URL', '')), '/');
        if ($configured && ! $this->isLocalUrl($configured)) {
            return $configured;
        }

        foreach (['Origin', 'Referer'] as $header) {
            $value = trim((string) $request->header($header));
            $origin = $value ? (parse_url($value, PHP_URL_SCHEME) . '://' . parse_url($value, PHP_URL_HOST) . (parse_url($value, PHP_URL_PORT) ? ':' . parse_url($value, PHP_URL_PORT) : '')) : '';
            if ($origin && ! $this->isLocalUrl($origin)) {
                return rtrim($origin, '/');
            }
        }

        $forwardedHost = trim((string) $request->header('X-Forwarded-Host'));
        if ($forwardedHost && ! $this->isLocalHost($forwardedHost)) {
            $scheme = trim((string) ($request->header('X-Forwarded-Proto') ?: $request->getScheme()));
            return $scheme . '://' . $forwardedHost;
        }

        return rtrim((string) env('FRONTEND_URL', config('app.url')), '/');
    }

    private function isLocalUrl(string $url): bool
    {
        return $this->isLocalHost((string) parse_url($url, PHP_URL_HOST));
    }

    private function isLocalHost(string $host): bool
    {
        return in_array(strtolower($host), ['localhost', '127.0.0.1', '0.0.0.0', '::1'], true);
    }

    public function resend(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $email = strtolower(trim($data['email']));
        $user = User::where('email', $email)->first();

        if ($user && ! $user->hasVerifiedEmail()) {
            $this->verification->send($user);
        }

        return response()->json([
            'message' => 'If an account exists with that email and it is not verified, a new verification link has been sent.',
        ], 202);
    }
}

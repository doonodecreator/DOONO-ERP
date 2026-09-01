<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class FcmPushService
{
    public function send(string $deviceToken, string $title, string $body): array
    {
        $credentials = $this->credentials();
        $accessToken = $this->accessToken($credentials);
        $projectId = (string) ($credentials['project_id'] ?? config('services.firebase.project_id'));

        if ($projectId === '') {
            throw new RuntimeException('Firebase project ID is not configured.');
        }

        $response = Http::withToken($accessToken)
            ->acceptJson()
            ->timeout(20)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => [
                    'token' => $deviceToken,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                ],
            ]);
        $response->throw();
        $json = $response->json();

        return [
            'provider_message_id' => is_string($json['name'] ?? null) ? $json['name'] : null,
            'metadata' => ['provider' => 'fcm'],
        ];
    }

    private function credentials(): array
    {
        $json = trim((string) config('services.firebase.service_account_json'));
        $path = trim((string) config('services.firebase.service_account_path'));

        if ($json === '' && $path !== '' && is_readable($path)) {
            $json = (string) file_get_contents($path);
        }

        if ($json === '') {
            throw new RuntimeException('Firebase service-account credentials are not configured.');
        }

        $credentials = json_decode($json, true);
        if (! is_array($credentials) || empty($credentials['client_email']) || empty($credentials['private_key'])) {
            throw new RuntimeException('Firebase service-account credentials are invalid.');
        }

        return $credentials;
    }

    private function accessToken(array $credentials): string
    {
        $now = time();
        $header = $this->base64Url(json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $payload = $this->base64Url(json_encode([
            'iss' => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ], JSON_THROW_ON_ERROR));
        $unsigned = $header.'.'.$payload;

        if (! openssl_sign($unsigned, $signature, $credentials['private_key'], OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('Firebase service-account signing failed.');
        }

        $response = Http::asForm()->timeout(20)->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $unsigned.'.'.$this->base64Url($signature),
        ]);
        $response->throw();
        $token = $response->json('access_token');

        if (! is_string($token) || $token === '') {
            throw new RuntimeException('Firebase did not return an access token.');
        }

        return $token;
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}

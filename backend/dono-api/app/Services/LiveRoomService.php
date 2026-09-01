<?php

namespace App\Services;

use App\Models\LiveRoom;
use App\Models\LiveRoomProviderEvent;
use App\Models\LiveRoomProviderOperation;
use App\Models\LiveRoomRecording;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class LiveRoomService
{
    public function configuration(): array
    {
        $config = config('services.live_rooms', []);
        $configured = (bool) ($config['enabled'] ?? false)
            && filled($config['provider'] ?? null)
            && filled($config['base_url'] ?? null)
            && filled($config['api_key'] ?? null)
            && filled($config['api_secret'] ?? null)
            && filled($config['webhook_secret'] ?? null);

        $adapterReady = $configured && ($config['provider'] ?? null) === 'livekit' && (bool) ($config['adapter_ready'] ?? false) && filled($config['public_url'] ?? null);

        return [
            'configured' => $configured,
            'provider' => $config['provider'] ?? null,
            'client_url' => $config['public_url'] ?? null,
            'streaming_ready' => $adapterReady,
            'message' => $adapterReady
                ? 'The LiveKit adapter is explicitly enabled. Continue monitoring signed callbacks and safeguarding controls in production.'
                : ($configured
                    ? 'Provider credentials exist, but the verified adapter readiness switch and client contract are not enabled.'
                    : 'Live rooms are scheduled-only until a provider, server-side credentials, admission controls, recording policy, and verified callbacks are configured.'),
        ];
    }

    public function diagnostics(?int $schoolId = null): array
    {
        $config = config('services.live_rooms', []);
        $recordingStorageReady = ! ($config['recording_enabled'] ?? false) || (filled($config['recording_bucket'] ?? null) && filled($config['recording_access_key'] ?? null) && filled($config['recording_secret'] ?? null));
        $checks = [
            ['key' => 'enabled', 'label' => 'Live-room feature enabled', 'ok' => (bool) ($config['enabled'] ?? false)],
            ['key' => 'provider', 'label' => 'Supported provider selected', 'ok' => ($config['provider'] ?? null) === 'livekit'],
            ['key' => 'base_url', 'label' => 'Private provider endpoint configured', 'ok' => filled($config['base_url'] ?? null)],
            ['key' => 'public_url', 'label' => 'Public client room URL configured', 'ok' => filled($config['public_url'] ?? null)],
            ['key' => 'api_key', 'label' => 'Provider API key configured', 'ok' => filled($config['api_key'] ?? null)],
            ['key' => 'api_secret', 'label' => 'Provider API secret configured', 'ok' => filled($config['api_secret'] ?? null)],
            ['key' => 'webhook_secret', 'label' => 'Webhook signing secret configured', 'ok' => filled($config['webhook_secret'] ?? null)],
            ['key' => 'adapter_ready', 'label' => 'Adapter readiness explicitly enabled', 'ok' => (bool) ($config['adapter_ready'] ?? false)],
            ['key' => 'recording_storage', 'label' => 'Recording storage configured or recording disabled', 'ok' => $recordingStorageReady],
        ];
        $lastWebhookAt = null;
        if (Schema::hasTable('live_room_provider_events')) {
            $lastWebhookAt = LiveRoomProviderEvent::query()->latest('created_at')->value('created_at');
        }
        $recentFailures = [];
        if (Schema::hasTable('live_room_provider_operations')) {
            $recentFailures = LiveRoomProviderOperation::query()->where('status', 'failed')->when($schoolId, fn ($query) => $query->where('school_id', $schoolId))->latest()->limit(10)->get(['id', 'live_room_id', 'operation', 'provider_status', 'error_message', 'attempted_at'])->toArray();
        }
        return ['ready' => collect($checks)->every(fn (array $check): bool => $check['ok']), 'checks' => $checks, 'last_webhook_at' => $lastWebhookAt, 'recent_failures' => $recentFailures, 'message' => 'Diagnostics expose configuration state only; they never expose provider secrets.'];
    }

    public function canStart(LiveRoom $room): bool
    {
        return $this->configuration()['streaming_ready'] === true && filled($room->provider_room_id);
    }

    public function providerRoomName(int $roomId): string
    {
        return 'room_' . substr(hash('sha256', config('app.key') . ':room:' . $roomId), 0, 32);
    }

    public function providerIdentity(int $schoolId, int $userId): string
    {
        return 'u_' . substr(hash('sha256', config('app.key') . ':' . $schoolId . ':' . $userId), 0, 32);
    }

    public function providerHostIdentity(int $roomId, int $userId): string
    {
        return 'h_' . substr(hash('sha256', config('app.key') . ':host:' . $roomId . ':' . $userId), 0, 32);
    }

    public function issueJoinToken(LiveRoom $room, string $identity, bool $canPublish = false): string
    {
        $config = config('services.live_rooms', []);
        abort_unless(($config['provider'] ?? null) === 'livekit', 422, 'The configured live-room provider does not have a verified token adapter.');
        abort_unless(filled($config['api_key'] ?? null) && filled($config['api_secret'] ?? null), 422, 'Live-room provider credentials are incomplete.');
        return $this->issueSignedToken($identity, [
            'room' => $room->provider_room_id,
            'roomJoin' => true,
            'canSubscribe' => true,
            'canPublish' => $canPublish,
            'canPublishSources' => $canPublish ? ['camera', 'microphone', 'screen_share', 'screen_share_audio'] : [],
            'canPublishData' => false,
        ], 300);
    }

    public function createProviderRoom(LiveRoom $room): array
    {
        abort_unless($this->configuration()['streaming_ready'] === true, 422, 'The live-room provider is not ready.');
        $result = $this->providerRequest($room, 'create_room', 'CreateRoom', ['roomCreate' => true], [
            'name' => $room->provider_room_id,
            'empty_timeout' => 600,
            'departure_timeout' => 20,
            'max_participants' => $room->max_participants,
            'metadata' => json_encode(['dono_room_id' => (string) $room->id], JSON_THROW_ON_ERROR),
        ], [409]);
        return $result['json'] ?: ['name' => $room->provider_room_id, 'already_exists' => $result['status'] === 409];
    }

    public function closeProviderRoom(LiveRoom $room): void
    {
        if ($this->configuration()['streaming_ready'] !== true || ! filled($room->provider_room_id)) {
            return;
        }
        $this->providerRequest($room, 'close_room', 'DeleteRoom', ['roomCreate' => true], ['room' => $room->provider_room_id], [404]);
    }

    public function startProviderRecording(LiveRoom $room): LiveRoomRecording
    {
        $config = config('services.live_rooms', []);
        abort_unless(($config['recording_enabled'] ?? false) && filled($config['recording_bucket']) && filled($config['recording_access_key']) && filled($config['recording_secret']), 422, 'Private recording storage is not configured.');
        $recording = LiveRoomRecording::create(['live_room_id' => $room->id, 'school_id' => $room->school_id, 'provider' => 'livekit', 'status' => 'requested', 'expires_at' => now()->addDays((int) ($config['recording_retention_days'] ?? 30))]);
        $s3 = ['access_key' => $config['recording_access_key'], 'secret' => $config['recording_secret'], 'bucket' => $config['recording_bucket'], 'region' => $config['recording_region']];
        if (filled($config['recording_s3_endpoint'] ?? null)) {
            $s3['endpoint'] = $config['recording_s3_endpoint'];
        }
        try {
            $result = $this->providerEgressRequest($room, 'start_recording', 'StartRoomCompositeEgress', ['roomRecord' => true, 'room' => $room->provider_room_id], ['room_name' => $room->provider_room_id, 'layout' => 'speaker', 'file_outputs' => [['file_type' => 1, 'filepath' => 'dono-recordings/' . $room->school_id . '/' . $room->id . '/{time}.mp4', 's3' => $s3]]]);
        } catch (\Throwable $exception) {
            $recording->update(['status' => 'failed', 'failure_message' => 'The recording provider request could not be completed.']);
            throw $exception;
        }
        $egressId = data_get($result['json'], 'egress_id') ?: data_get($result['json'], 'egressId');
        if (! $egressId) {
            $recording->update(['status' => 'failed', 'failure_message' => 'The provider did not return a recording identity.']);
            throw ValidationException::withMessages(['recording' => 'The provider did not return a recording identity.']);
        }
        $recording->update(['provider_egress_id' => $egressId, 'status' => 'starting', 'started_at' => now()]);
        return $recording->fresh();
    }

    public function stopProviderRecording(LiveRoom $room): void
    {
        if ($this->configuration()['streaming_ready'] !== true || ! Schema::hasTable('live_room_recordings')) {
            return;
        }
        $recording = $room->recordings()->whereIn('status', ['requested', 'starting', 'recording'])->whereNotNull('provider_egress_id')->latest()->first();
        if (! $recording) {
            return;
        }
        $this->providerEgressRequest($room, 'stop_recording', 'StopEgress', ['roomRecord' => true, 'room' => $room->provider_room_id], ['egress_id' => $recording->provider_egress_id], [404]);
        $recording->update(['status' => 'stopping', 'ended_at' => now()]);
    }

    public function muteProviderParticipant(LiveRoom $room, string $identity, bool $muted): void
    {
        if ($this->configuration()['streaming_ready'] !== true || ! filled($room->provider_room_id) || $identity === '') {
            return;
        }
        $listResponse = Http::timeout(10)->withToken($this->issueSignedToken('dono-room-service', ['roomAdmin' => true, 'room' => $room->provider_room_id], 120))->post($this->providerEndpoint('ListParticipants'), ['room' => $room->provider_room_id]);
        if ($listResponse->failed()) {
            throw ValidationException::withMessages(['provider' => 'The live provider could not list room participants: ' . $listResponse->status() . '.']);
        }
        $providerParticipant = collect($listResponse->json('participants', []))->firstWhere('identity', $identity);
        foreach ((array) data_get($providerParticipant, 'tracks', []) as $track) {
            $trackSid = data_get($track, 'sid');
            if ($trackSid) {
                $this->providerRequest($room, 'mute_participant', 'MutePublishedTrack', ['roomAdmin' => true, 'room' => $room->provider_room_id], ['room' => $room->provider_room_id, 'identity' => $identity, 'track_sid' => $trackSid, 'muted' => $muted], [404]);
            }
        }
    }

    public function removeProviderParticipant(LiveRoom $room, string $identity): void
    {
        if ($this->configuration()['streaming_ready'] !== true || ! filled($room->provider_room_id) || $identity === '') {
            return;
        }
        $this->providerRequest($room, 'remove_participant', 'RemoveParticipant', ['roomAdmin' => true, 'room' => $room->provider_room_id], ['room' => $room->provider_room_id, 'identity' => $identity, 'revoke_token_ts' => time()], [404]);
    }

    private function providerEgressRequest(LiveRoom $room, string $operation, string $method, array $grant, array $payload, array $allowedStatuses = []): array
    {
        $attempt = LiveRoomProviderOperation::create(['live_room_id' => $room->id, 'school_id' => $room->school_id, 'operation' => $operation, 'status' => 'pending', 'attempted_at' => now()]);
        try {
            $response = Http::timeout(15)->withToken($this->issueSignedToken('dono-egress-service', $grant, 120))->post(rtrim((string) config('services.live_rooms.base_url'), '/') . '/twirp/livekit.Egress/' . $method, $payload);
        } catch (\Throwable $exception) {
            $attempt->update(['status' => 'failed', 'error_message' => 'The provider request could not be completed.', 'completed_at' => now()]);
            throw ValidationException::withMessages(['provider' => 'The live provider request could not be completed.']);
        }
        $status = $response->status();
        if ($response->failed() && ! in_array($status, $allowedStatuses, true)) {
            $attempt->update(['status' => 'failed', 'provider_status' => $status, 'error_message' => 'The provider rejected the recording operation.', 'completed_at' => now()]);
            throw ValidationException::withMessages(['provider' => 'The live provider rejected the recording operation: ' . $status . '.']);
        }
        $attempt->update(['status' => 'succeeded', 'provider_status' => $status, 'completed_at' => now()]);
        return ['status' => $status, 'json' => is_array($response->json()) ? $response->json() : []];
    }

    private function providerRequest(LiveRoom $room, string $operation, string $method, array $grant, array $payload, array $allowedStatuses = []): array
    {
        $attempt = LiveRoomProviderOperation::create(['live_room_id' => $room->id, 'school_id' => $room->school_id, 'operation' => $operation, 'status' => 'pending', 'attempted_at' => now()]);
        try {
            $response = Http::timeout(10)->withToken($this->issueSignedToken('dono-room-service', $grant, 120))->post($this->providerEndpoint($method), $payload);
        } catch (\Throwable $exception) {
            $attempt->update(['status' => 'failed', 'error_message' => 'The provider request could not be completed.', 'completed_at' => now()]);
            throw ValidationException::withMessages(['provider' => 'The live provider request could not be completed.']);
        }
        $status = $response->status();
        if ($response->failed() && ! in_array($status, $allowedStatuses, true)) {
            $attempt->update(['status' => 'failed', 'provider_status' => $status, 'error_message' => 'The provider rejected the requested operation.', 'completed_at' => now()]);
            throw ValidationException::withMessages(['provider' => 'The live provider rejected the requested operation: ' . $status . '.']);
        }
        $attempt->update(['status' => 'succeeded', 'provider_status' => $status, 'completed_at' => now()]);
        return ['status' => $status, 'json' => is_array($response->json()) ? $response->json() : []];
    }

    private function issueSignedToken(string $identity, array $videoGrant, int $ttl): string
    {
        $config = config('services.live_rooms', []);
        $now = time();
        $header = $this->base64Url(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $payload = $this->base64Url(json_encode(['iss' => $config['api_key'], 'sub' => $identity, 'nbf' => $now, 'exp' => $now + $ttl, 'video' => $videoGrant], JSON_THROW_ON_ERROR));
        $signingInput = $header . '.' . $payload;
        return $signingInput . '.' . $this->base64Url(hash_hmac('sha256', $signingInput, $config['api_secret'], true));
    }

    private function providerEndpoint(string $method): string
    {
        return rtrim((string) config('services.live_rooms.base_url'), '/') . '/twirp/livekit.RoomService/' . $method;
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}

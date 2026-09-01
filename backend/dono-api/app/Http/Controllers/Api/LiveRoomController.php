<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExchangeProject;
use App\Models\LiveRoom;
use App\Models\LiveRoomParticipant;
use App\Models\LiveRoomReport;
use App\Models\LiveRoomProviderEvent;
use App\Models\LiveRoomRecording;
use App\Models\Student;
use App\Models\StudentCommunityConsent;
use App\Models\StudentEnrollment;
use App\Services\ActivityLogService;
use App\Services\LiveRoomService;
use Illuminate\Http\Request;

class LiveRoomController extends Controller
{
    public function __construct(private readonly LiveRoomService $liveRooms)
    {
    }

    public function configuration(): array
    {
        return $this->liveRooms->configuration();
    }

    public function studentIndex(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->activeStudent($request, $schoolId);
        $rooms = LiveRoom::query()
            ->whereIn('status', ['approved', 'scheduled', 'live'])
            ->where(function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId)
                    ->orWhereHas('exchangeProject.participatingSchools', fn ($nested) => $nested->where('school_id', $schoolId)->where('status', 'accepted'));
            })
            ->with(['school:id,name,country_id', 'exchangeProject:id,title,allow_international', 'participants' => fn ($query) => $query->where('student_id', $student->id)])
            ->orderByRaw("CASE WHEN status = 'live' THEN 0 ELSE 1 END")
            ->orderBy('starts_at')
            ->paginate(20);

        return response()->json(['data' => $rooms, 'provider' => $this->liveRooms->configuration()]);
    }

    public function rooms(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => LiveRoom::query()->where('school_id', $schoolId)->with(['exchangeProject:id,title', 'host:id,display_name', 'participants' => fn ($query) => $query->whereIn('status', ['waiting', 'admitted']), 'recordings:id,live_room_id,status,provider_egress_id,file_mime,file_size,duration_seconds,started_at,ended_at,expires_at,failure_message'])->latest()->paginate(30), 'provider' => $this->liveRooms->configuration()]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:5000'],
            'audience_type' => ['required', 'in:school,exchange_project'],
            'exchange_project_id' => ['nullable', 'integer', 'exists:exchange_projects,id'],
            'max_participants' => ['required', 'integer', 'min:2', 'max:500'],
            'recording_enabled' => ['boolean'],
            'recording_consent_required' => ['boolean'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
        ]);
        $project = null;
        if ($validated['audience_type'] === 'exchange_project') {
            $project = ExchangeProject::query()->whereKey($validated['exchange_project_id'] ?? 0)->where('school_id', $schoolId)->where('status', 'published')->first();
            abort_unless($project, 422, 'An approved project owned by this school is required for an exchange room.');
        } elseif (! empty($validated['exchange_project_id'])) {
            return response()->json(['message' => 'A school-only room cannot include an exchange project.'], 422);
        }
        if (($validated['recording_enabled'] ?? false) && ! ($validated['recording_consent_required'] ?? true)) {
            return response()->json(['message' => 'Recording consent cannot be disabled for a student room.'], 422);
        }
        $room = LiveRoom::create($validated + ['school_id' => $schoolId, 'host_user_id' => $request->user()->id, 'status' => 'pending_review', 'provider' => config('services.live_rooms.provider')]);
        ActivityLogService::log('live_room', 'room_submitted', 'A school submitted a live room for approval.', $room, ['title' => $room->title, 'audience_type' => $room->audience_type], $schoolId);
        return response()->json(['message' => 'Room submitted for school approval. It remains scheduled-only until a live provider is configured.', 'data' => $room->load('exchangeProject'), 'provider' => $this->liveRooms->configuration()], 201);
    }

    public function approve(Request $request, LiveRoom $liveRoom)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $liveRoom->school_id === $schoolId, 404, 'Live room not found in this school.');
        abort_unless($liveRoom->status === 'pending_review', 422, 'This room is not awaiting approval.');
        $liveRoom->update(['status' => 'scheduled', 'provider_room_id' => $liveRoom->provider_room_id ?: $this->liveRooms->providerRoomName($liveRoom->id), 'approved_by' => $request->user()->id, 'approved_at' => now()]);
        ActivityLogService::log('live_room', 'room_approved', 'A school moderator approved a live room schedule.', $liveRoom, ['title' => $liveRoom->title], $schoolId);
        return response()->json(['message' => 'Room approved and scheduled.', 'data' => $liveRoom->fresh(), 'provider' => $this->liveRooms->configuration()]);
    }

    public function start(Request $request, LiveRoom $liveRoom)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $liveRoom->school_id === $schoolId, 404, 'Live room not found in this school.');
        abort_unless(in_array($liveRoom->status, ['scheduled', 'approved'], true), 422, 'Only an approved scheduled room can start.');
        abort_unless($this->liveRooms->canStart($liveRoom), 422, 'Live streaming is not available. Configure and verify the provider adapter before starting a room.');
        $this->liveRooms->createProviderRoom($liveRoom);
        if ($liveRoom->recording_enabled) {
            $this->liveRooms->startProviderRecording($liveRoom);
        }
        $liveRoom->update(['status' => 'live']);
        ActivityLogService::log('live_room', 'room_started', 'A verified live room was started.', $liveRoom, ['title' => $liveRoom->title], $schoolId);
        return response()->json(['message' => 'Room started.', 'data' => $liveRoom->fresh()]);
    }

    public function close(Request $request, LiveRoom $liveRoom)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $liveRoom->school_id === $schoolId, 404, 'Live room not found in this school.');
        abort_unless(in_array($liveRoom->status, ['scheduled', 'live'], true), 422, 'This room is already closed or unavailable.');
        $this->liveRooms->stopProviderRecording($liveRoom);
        $this->liveRooms->closeProviderRoom($liveRoom);
        $liveRoom->update(['status' => 'closed', 'closed_at' => now()]);
        $liveRoom->participants()->whereIn('status', ['waiting', 'admitted'])->update(['status' => 'left']);
        ActivityLogService::log('live_room', 'room_closed', 'A school moderator closed a live room.', $liveRoom, ['title' => $liveRoom->title], $schoolId);
        return response()->json(['message' => 'Room closed.']);
    }

    public function requestJoin(Request $request, LiveRoom $liveRoom)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->activeStudent($request, $schoolId);
        abort_unless(in_array($liveRoom->status, ['scheduled', 'live'], true), 422, 'This room is not open for participation.');
        $isHostSchool = (int) $liveRoom->school_id === $schoolId;
        if ($liveRoom->audience_type === 'exchange_project') {
            $project = $liveRoom->exchangeProject()->where('status', 'published')->first();
            abort_unless($project && $project->participatingSchools()->where('school_id', $schoolId)->where('status', 'accepted')->exists(), 403, 'Your school is not an accepted participant in this exchange room.');
            if ($project->allow_international && ! $isHostSchool) {
                $consent = StudentCommunityConsent::query()->where('school_id', $schoolId)->where('student_id', $student->id)->first();
                abort_unless($consent?->status === 'approved' && $consent->global_exchange_allowed, 403, 'Guardian consent is required for international live-room participation.');
            }
        } else {
            abort_unless($isHostSchool, 403, 'This school room is not available outside its school.');
        }
        $activeCount = $liveRoom->participants()->whereIn('status', ['waiting', 'admitted'])->count();
        abort_if($activeCount >= $liveRoom->max_participants, 422, 'This room has reached its participant limit.');
        $recordingConsent = true;
        if ($liveRoom->recording_enabled) {
            $consent = StudentCommunityConsent::query()->where('school_id', $schoolId)->where('student_id', $student->id)->first();
            abort_unless($consent?->status === 'approved' && $consent->video_allowed, 403, 'Guardian recording consent is required for this room.');
        }
        $participant = LiveRoomParticipant::query()->updateOrCreate(
            ['live_room_id' => $liveRoom->id, 'user_id' => $request->user()->id],
            ['school_id' => $schoolId, 'student_id' => $student->id, 'recording_consent' => $recordingConsent, 'recording_consent_at' => $recordingConsent && $liveRoom->recording_enabled ? now() : null, 'display_alias' => 'Learner-' . strtoupper(substr(hash('sha256', $student->id . ':' . $liveRoom->id), 0, 8)), 'provider_identity' => $this->liveRooms->providerIdentity($schoolId, $request->user()->id), 'status' => 'waiting', 'requested_at' => now(), 'admitted_at' => null, 'removed_at' => null, 'removed_by' => null]
        );
        ActivityLogService::log('live_room', 'participant_requested', 'A student requested live-room admission.', $participant, ['room_id' => $liveRoom->id], $schoolId);
        return response()->json(['message' => 'You are in the waiting room. A school moderator must admit you after the live provider is ready.', 'data' => $participant, 'provider' => $this->liveRooms->configuration()]);
    }

    public function hostToken(Request $request, LiveRoom $liveRoom)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $liveRoom->school_id === $schoolId, 404, 'Live room not found in this school.');
        abort_unless((int) $liveRoom->host_user_id === (int) $request->user()->id, 403, 'Only the assigned room host can open host controls.');
        abort_unless($liveRoom->status === 'live' && $this->liveRooms->canStart($liveRoom), 422, 'This room is not currently ready for a provider connection.');
        $identity = $this->liveRooms->providerHostIdentity($liveRoom->id, $request->user()->id);
        return response()->json(['data' => ['token' => $this->liveRooms->issueJoinToken($liveRoom, $identity, true), 'url' => config('services.live_rooms.public_url'), 'expires_in' => 300, 'role' => 'host'], 'provider' => $this->liveRooms->configuration()]);
    }

    public function joinToken(Request $request, LiveRoom $liveRoom)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->activeStudent($request, $schoolId);
        abort_unless($liveRoom->status === 'live' && $this->liveRooms->canStart($liveRoom), 422, 'This room is not currently ready for a provider connection.');
        $participant = $liveRoom->participants()->where('user_id', $request->user()->id)->where('student_id', $student->id)->where('status', 'admitted')->first();
        abort_unless($participant, 403, 'A moderator must admit you before a room token can be issued.');
        abort_unless(! $liveRoom->recording_enabled || $participant->recording_consent, 403, 'Guardian recording consent is required before a room token can be issued.');
        $identity = $participant->provider_identity ?: $this->liveRooms->providerIdentity($schoolId, $request->user()->id);
        $participant->update(['provider_identity' => $identity]);
        return response()->json(['data' => ['token' => $this->liveRooms->issueJoinToken($liveRoom, $identity, false), 'url' => config('services.live_rooms.public_url'), 'expires_in' => 300], 'provider' => $this->liveRooms->configuration()]);
    }

    public function admit(Request $request, LiveRoomParticipant $liveRoomParticipant)
    {
        $schoolId = $this->requireSchool($request);
        $participant = $liveRoomParticipant->load('room');
        abort_unless((int) $participant->room->school_id === $schoolId, 404, 'Participant not found in this school.');
        abort_unless($participant->status === 'waiting', 422, 'This participant is not waiting for admission.');
        abort_unless($participant->room->status === 'live' && $this->liveRooms->canStart($participant->room), 422, 'The room provider is not ready for admission.');
        abort_unless(! $participant->room->recording_enabled || $participant->recording_consent, 403, 'Guardian recording consent is required before admission.');
        $participant->update(['status' => 'admitted', 'admitted_at' => now()]);
        ActivityLogService::log('live_room', 'participant_admitted', 'A moderator admitted a live-room participant.', $participant, ['room_id' => $participant->live_room_id], $schoolId);
        return response()->json(['message' => 'Participant admitted.', 'data' => $participant->fresh()]);
    }

    public function mute(Request $request, LiveRoomParticipant $liveRoomParticipant)
    {
        $schoolId = $this->requireSchool($request);
        $participant = $liveRoomParticipant->load('room');
        abort_unless((int) $participant->room->school_id === $schoolId, 404, 'Participant not found in this school.');
        abort_unless($participant->room->status === 'live', 422, 'Participant audio/video can only be moderated while the room is live.');
        abort_unless(in_array($participant->status, ['admitted'], true), 422, 'This participant is not currently admitted.');
        $validated = $request->validate(['muted' => ['required', 'boolean']]);
        $this->liveRooms->muteProviderParticipant($participant->room, (string) $participant->provider_identity, (bool) $validated['muted']);
        ActivityLogService::log('live_room', $validated['muted'] ? 'participant_muted' : 'participant_unmuted', 'A moderator changed a live-room participant audio/video state.', $participant, ['room_id' => $participant->live_room_id], $schoolId);
        return response()->json(['message' => $validated['muted'] ? 'Participant tracks muted.' : 'Participant tracks unmuted.']);
    }

    public function remove(Request $request, LiveRoomParticipant $liveRoomParticipant)
    {
        $schoolId = $this->requireSchool($request);
        $participant = $liveRoomParticipant->load('room');
        abort_unless((int) $participant->room->school_id === $schoolId, 404, 'Participant not found in this school.');
        abort_unless(in_array($participant->status, ['waiting', 'admitted'], true), 422, 'This participant is no longer active.');
        $this->liveRooms->removeProviderParticipant($participant->room, (string) $participant->provider_identity);
        $participant->update(['status' => 'removed', 'removed_at' => now(), 'removed_by' => $request->user()->id]);
        ActivityLogService::log('live_room', 'participant_removed', 'A moderator removed a live-room participant.', $participant, ['room_id' => $participant->live_room_id], $schoolId);
        return response()->json(['message' => 'Participant removed.']);
    }

    public function report(Request $request, LiveRoom $liveRoom)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->activeStudent($request, $schoolId);
        abort_unless((int) $liveRoom->school_id === $schoolId || ($liveRoom->audience_type === 'exchange_project' && $liveRoom->exchangeProject?->participatingSchools()->where('school_id', $schoolId)->where('status', 'accepted')->exists()), 403, 'You cannot report in this room context.');
        $validated = $request->validate(['participant_user_id' => ['nullable', 'integer', 'exists:users,id'], 'reason' => ['required', 'in:bullying,harassment,unsafe,privacy,sexual_content,spam,other'], 'details' => ['nullable', 'string', 'max:2000']]);
        $report = LiveRoomReport::create($validated + ['live_room_id' => $liveRoom->id, 'school_id' => $schoolId, 'reporter_user_id' => $request->user()->id, 'status' => 'open']);
        ActivityLogService::log('live_room', 'room_reported', 'A student submitted a live-room safety report.', $report, ['room_id' => $liveRoom->id, 'student_id' => $student->id], $schoolId);
        return response()->json(['message' => 'The report was sent to the school safeguarding team.', 'data' => $report], 201);
    }

    public function livekitWebhook(Request $request)
    {
        $config = config('services.live_rooms', []);
        abort_unless(($config['provider'] ?? null) === 'livekit' && filled($config['webhook_secret'] ?? null), 401, 'LiveKit webhook verification is not configured.');
        $raw = $request->getContent();
        $authorization = (string) $request->header('Authorization', '');
        $parts = explode('.', $authorization);
        abort_unless(count($parts) === 3, 401, 'Invalid LiveKit webhook authorization.');
        $payload = json_decode($this->decodeBase64Url($parts[1]), true);
        abort_unless(is_array($payload), 401, 'Invalid LiveKit webhook token.');
        $expected = $this->base64Url(hash_hmac('sha256', $parts[0] . '.' . $parts[1], $config['webhook_secret'], true));
        abort_unless(hash_equals($expected, $parts[2]), 401, 'Invalid LiveKit webhook signature.');
        abort_unless(isset($payload['sha256']) && hash_equals((string) $payload['sha256'], hash('sha256', $raw)), 401, 'LiveKit webhook payload verification failed.');
        try {
            $event = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return response()->json(['message' => 'Invalid webhook JSON.'], 400);
        }
        $eventId = (string) ($event['id'] ?? '');
        $eventName = (string) ($event['event'] ?? '');
        abort_unless($eventId !== '' && $eventName !== '', 422, 'LiveKit webhook event identity is incomplete.');
        $providerEvent = LiveRoomProviderEvent::query()->firstOrCreate(
            ['provider' => 'livekit', 'event_id' => $eventId],
            ['event_name' => $eventName, 'provider_room_id' => data_get($event, 'room.name'), 'payload' => $event]
        );
        if ($providerEvent->processed_at) {
            return response()->json(['message' => 'Webhook already processed.'], 202);
        }
        $roomName = data_get($event, 'room.name');
        $room = $roomName ? LiveRoom::query()->where('provider_room_id', $roomName)->first() : null;
        if ($room) {
            if ($eventName === 'room_started' && in_array($room->status, ['scheduled', 'approved'], true)) {
                $room->update(['status' => 'live']);
            } elseif ($eventName === 'room_finished' && in_array($room->status, ['scheduled', 'live'], true)) {
                $room->update(['status' => 'closed', 'closed_at' => now()]);
                $room->participants()->whereIn('status', ['waiting', 'admitted'])->update(['status' => 'left']);
            } elseif ($eventName === 'participant_joined') {
                $identity = (string) data_get($event, 'participant.identity', '');
                $participant = $room->participants()->where('provider_identity', $identity)->first();
                if ($participant && $participant->status === 'waiting') {
                    $participant->update(['status' => 'admitted', 'admitted_at' => now()]);
                }
            } elseif (in_array($eventName, ['participant_left', 'participant_connection_aborted'], true)) {
                $identity = (string) data_get($event, 'participant.identity', '');
                $room->participants()->where('provider_identity', $identity)->whereIn('status', ['waiting', 'admitted'])->update(['status' => 'left']);
            }
            ActivityLogService::log('live_room', 'provider_webhook_processed', 'A verified live-room provider event was processed.', $room, ['event' => $eventName], (int) $room->school_id);
        }
        if (in_array($eventName, ['egress_started', 'egress_updated', 'egress_ended'], true)) {
            $egressInfo = data_get($event, 'egressInfo') ?: data_get($event, 'egress_info', []);
            $egressId = data_get($egressInfo, 'egress_id') ?: data_get($egressInfo, 'egressId');
            $recording = $egressId ? LiveRoomRecording::query()->where('provider', 'livekit')->where('provider_egress_id', $egressId)->first() : null;
            if ($recording) {
                $providerStatus = data_get($egressInfo, 'status');
                $status = match ((string) $providerStatus) {
                    'EGRESS_STARTING', '0' => 'starting',
                    'EGRESS_ACTIVE', '1' => 'recording',
                    'EGRESS_ENDING', '2' => 'stopping',
                    'EGRESS_COMPLETE', '3' => 'completed',
                    'EGRESS_FAILED', '4', 'EGRESS_ABORTED', '5', 'EGRESS_LIMIT_REACHED', '6' => 'failed',
                    default => $recording->status,
                };
                $file = data_get($egressInfo, 'file_results.0') ?: data_get($egressInfo, 'fileResults.0', []);
                $duration = data_get($file, 'duration');
                $recording->update(['status' => $status, 'file_path' => data_get($file, 'location') ?: $recording->file_path, 'file_mime' => data_get($file, 'location') ? 'video/mp4' : $recording->file_mime, 'file_size' => data_get($file, 'size') ?: $recording->file_size, 'duration_seconds' => is_numeric($duration) ? (int) round(((float) $duration) / 1000000000) : $recording->duration_seconds, 'failure_message' => $status === 'failed' ? substr((string) (data_get($egressInfo, 'error') ?: data_get($egressInfo, 'details')), 0, 1000) : $recording->failure_message, 'started_at' => $recording->started_at ?: (data_get($egressInfo, 'started_at') ? now()->setTimestamp((int) data_get($egressInfo, 'started_at')) : null), 'ended_at' => in_array($status, ['completed', 'failed'], true) ? ($recording->ended_at ?: now()) : $recording->ended_at]);
            }
        }
        $providerEvent->update(['processed_at' => now()]);
        return response()->json(['message' => 'Webhook accepted.'], 202);
    }

    public function diagnostics(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => $this->liveRooms->diagnostics($schoolId), 'provider' => $this->liveRooms->configuration()]);
    }

    public function moderation(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => ['rooms' => LiveRoom::query()->where('school_id', $schoolId)->with(['participants' => fn ($query) => $query->whereIn('status', ['waiting', 'admitted']), 'reports' => fn ($query) => $query->whereIn('status', ['open', 'in_review'])])->latest()->paginate(30, ['*'], 'rooms_page'), 'reports' => LiveRoomReport::query()->where('school_id', $schoolId)->whereIn('status', ['open', 'in_review'])->with('room:id,title')->latest()->paginate(30, ['*'], 'reports_page')], 'provider' => $this->liveRooms->configuration()]);
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function decodeBase64Url(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/')) ?: '';
    }

    private function activeStudent(Request $request, int $schoolId): Student
    {
        $student = Student::query()->where('school_id', $schoolId)->where('user_id', $request->user()->id)->where('status', 'Active')->first();
        abort_unless($student, 403, 'An active linked student record is required.');
        abort_unless(StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists(), 403, 'An active school enrollment is required.');
        return $student;
    }
}

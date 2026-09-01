<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessCommunicationDelivery;
use App\Http\Requests\StoreCommunicationRequest;
use App\Http\Requests\UpdateCommunicationRequest;
use App\Models\Communication;
use App\Models\CommunicationDelivery;
use App\Models\CommunicationRead;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\NotificationService;
use App\Services\CommunicationDeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class CommunicationController extends Controller
{
    public function __construct(
        private CurrentContextService $context,
        private NotificationService $notifications,
        private CommunicationDeliveryService $externalDeliveries,
    ) {}

    private const MANAGEMENT_ROLES = [
        'proprietor',
        'principal',
        'vice_principal_academic',
        'vice_principal_admin',
    ];
    public function channels(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $twilio = config('services.twilio', []);
        $firebase = config('services.firebase', []);
        $twilioHasSender = trim((string) ($twilio['messaging_service_sid'] ?? '')) !== '' || trim((string) ($twilio['from'] ?? '')) !== '';
        $twilioReady = trim((string) ($twilio['account_sid'] ?? '')) !== ''
            && trim((string) ($twilio['auth_token'] ?? '')) !== ''
            && $twilioHasSender
            && trim((string) ($twilio['status_callback_url'] ?? '')) !== '';
        $firebaseCredentials = trim((string) ($firebase['service_account_json'] ?? '')) !== ''
            || (trim((string) ($firebase['service_account_path'] ?? '')) !== '' && is_file((string) $firebase['service_account_path']));
        $firebaseReady = trim((string) ($firebase['project_id'] ?? '')) !== '' && $firebaseCredentials;

        return response()->json(['data' => [
            'school_id' => (int) $schoolId,
            'channels' => [
                'in_app' => ['available' => true, 'label' => 'In-app notification'],
                'sms' => [
                    'available' => $twilioReady,
                    'label' => 'SMS via Twilio',
                    'message' => $twilioReady ? null : 'SMS is unavailable until Twilio credentials, a sender, and a public status-callback URL are configured.',
                ],
                'push' => [
                    'available' => $firebaseReady,
                    'label' => 'Push via Firebase',
                    'message' => $firebaseReady ? null : 'Push is unavailable until a Firebase project and server-side service account are configured.',
                ],
            ],
        ]]);
    }

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $user = $request->user();
        $audiences = $this->audiencesFor($user, (int) $schoolId);

        $query = Communication::with([
                'sender:id,name,email',
                'recipient:id,name,email',
                'reads' => fn ($readQuery) => $readQuery->where('user_id', $user->id),
            ])
            ->where('school_id', $schoolId)
            ->where(function ($query) use ($user, $audiences) {
                $query->where(function ($published) use ($audiences) {
                    $published->where('is_published', true)
                        ->where(function ($visible) use ($audiences) {
                            $visible->where('audience', 'all')->orWhereIn('audience', $audiences);
                        });
                })
                ->orWhere('recipient_id', $user->id)
                ->orWhere('sender_id', $user->id);
            })
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->input('type')))
            ->latest('published_at')
            ->latest('id');

        $page = $query->paginate(min(max($request->integer('per_page', 25), 1), 100));
        $page->getCollection()->transform(function (Communication $communication) use ($user) {
            $communication->read_at = $communication->reads->first()?->read_at
                ?? ((int) $communication->recipient_id === (int) $user->id ? $communication->getRawOriginal('read_at') : null);
            $communication->unsetRelation('reads');
            return $communication;
        });

        return response()->json($page);
    }

    public function store(StoreCommunicationRequest $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validated();
        $recipientId = $data['recipient_id'] ?? null;

        if ($recipientId !== null) {
            abort_unless(
                DB::table('user_roles')->where('user_id', $recipientId)->where('school_id', $schoolId)->exists(),
                422,
                'The selected recipient does not belong to the active school.'
            );
        }

        $communication = Communication::create([
            ...$data,
            'school_id' => $schoolId,
            'sender_id' => $request->user()->id,
            'type' => $data['type'] ?? 'notice',
            'published_at' => ($data['is_published'] ?? true) ? now() : null,
            'is_published' => $data['is_published'] ?? true,
            'delivery_channel' => $data['delivery_channel'] ?? 'in_app',
        ]);

        $this->deliverIfPublished($communication);

        ActivityLogService::log(
            module: 'communication',
            action: 'created',
            description: "Communication {$communication->id} was created.",
            subject: $communication,
            schoolId: $schoolId,
            properties: ['type' => $communication->type, 'audience' => $communication->audience],
        );

        return response()->json(['data' => $communication->load(['sender:id,name,email', 'recipient:id,name,email'])], 201);
    }

    public function show(Request $request, Communication $communication)
    {
        $this->ensureSchool($request, $communication);

        return response()->json(['data' => $communication->load(['sender:id,name,email', 'recipient:id,name,email'])]);
    }

    public function update(UpdateCommunicationRequest $request, Communication $communication)
    {
        $schoolId = $this->ensureCanManage($request, $communication);
        $data = $request->validated();

        if (array_key_exists('recipient_id', $data) && $data['recipient_id'] !== null) {
            abort_unless(
                DB::table('user_roles')->where('user_id', $data['recipient_id'])->where('school_id', $schoolId)->exists(),
                422,
                'The selected recipient does not belong to the active school.'
            );
        }

        $nextAudience = $data['audience'] ?? $communication->audience;
        if ($nextAudience !== 'individual' && ! array_key_exists('recipient_id', $data)) {
            $data['recipient_id'] = null;
        }
        if ($nextAudience === 'individual' && blank($data['recipient_id'] ?? $communication->recipient_id)) {
            return response()->json(['message' => 'An individual communication must have a recipient.'], 422);
        }

        $wasPublished = (bool) $communication->is_published;
        $deliveryDefinitionChanged = (bool) array_intersect(
            array_keys($data),
            ['type', 'audience', 'recipient_id', 'subject', 'body', 'delivery_channel'],
        );
        $communication->update($data);
        if (array_key_exists('is_published', $data)) {
            $communication->published_at = $data['is_published'] ? ($communication->published_at ?: now()) : null;
            $communication->save();
        }

        $isRepublished = ! $wasPublished && (bool) $communication->is_published;
        if ($communication->is_published && ($isRepublished || ($wasPublished && $deliveryDefinitionChanged))) {
            $this->clearPreviousDeliveries($communication);
        }
        if (! $communication->is_published && $wasPublished) {
            $this->clearPreviousDeliveries($communication);
        }

        $this->deliverIfPublished($communication);

        ActivityLogService::log(
            module: 'communication',
            action: 'updated',
            description: "Communication {$communication->id} was updated.",
            subject: $communication,
            schoolId: $schoolId,
            properties: ['changed_fields' => array_keys($data)],
        );

        return response()->json(['data' => $communication->fresh()->load(['sender:id,name,email', 'recipient:id,name,email'])]);
    }

    public function destroy(Request $request, Communication $communication)
    {
        $schoolId = $this->ensureCanManage($request, $communication);
        $id = $communication->id;
        $communication->delete();

        ActivityLogService::log(
            module: 'communication',
            action: 'deleted',
            description: "Communication {$id} was deleted.",
            schoolId: $schoolId,
            properties: ['communication_id' => $id],
        );

        return response()->json(['message' => 'Communication deleted successfully.']);
    }

    public function retryDelivery(Request $request, Communication $communication)
    {
        $schoolId = $this->ensureCanManage($request, $communication);
        abort_unless($communication->is_published, 422, 'Only published communications can be retried.');
        abort_unless(in_array($communication->delivery_channel, ['sms', 'push'], true), 422, 'Only SMS and push deliveries can be retried.');

        $deliveries = CommunicationDelivery::query()
            ->where('school_id', $schoolId)
            ->where('communication_id', $communication->id)
            ->where('status', 'failed')
            ->get();

        foreach ($deliveries as $delivery) {
            $delivery->forceFill([
                'status' => 'pending',
                'failed_at' => null,
                'failure_code' => null,
                'failure_message' => null,
            ])->save();
            ProcessCommunicationDelivery::dispatch($delivery->id)->onQueue('communications');
        }

        ActivityLogService::log(
            module: 'communication',
            action: 'delivery_retry_queued',
            description: 'Failed external communication deliveries were queued for retry.',
            subject: $communication,
            schoolId: $schoolId,
            properties: ['delivery_count' => $deliveries->count(), 'channel' => $communication->delivery_channel],
        );

        ProcessCommunicationDelivery::refreshCommunicationStatus((int) $communication->id);

        return response()->json([
            'message' => $deliveries->count() > 0 ? 'Failed deliveries queued for retry.' : 'There are no failed deliveries to retry.',
            'data' => ['queued_count' => $deliveries->count()],
        ]);
    }

    public function markRead(Request $request, Communication $communication)
    {
        $this->ensureSchool($request, $communication);
        abort_unless($communication->recipient_id === null || $communication->recipient_id === $request->user()->id, 403);
        CommunicationRead::updateOrCreate(
            [
                'communication_id' => $communication->id,
                'user_id' => $request->user()->id,
            ],
            [
                'school_id' => $communication->school_id,
                'read_at' => now(),
            ],
        );

        return response()->json(['data' => $communication->fresh()]);
    }

    private function clearPreviousDeliveries(Communication $communication): void
    {
        DB::table('app_notifications')
            ->where('source_type', Communication::class)
            ->where('source_id', $communication->id)
            ->delete();
        DB::table('communication_reads')
            ->where('communication_id', $communication->id)
            ->delete();
        CommunicationDelivery::query()
            ->where('communication_id', $communication->id)
            ->delete();
    }

    private function deliverIfPublished(Communication $communication): void
    {
        if (! $communication->is_published) {
            $communication->forceFill([
                'delivery_status' => 'not_sent',
                'delivery_recipient_count' => 0,
                'delivery_attempted_at' => null,
                'delivered_at' => null,
                'delivery_error' => null,
            ])->save();
            return;
        }

        $channel = in_array($communication->delivery_channel, ['sms', 'push'], true)
            ? $communication->delivery_channel
            : 'in_app';

        $communication->forceFill([
            'delivery_channel' => $channel,
            'delivery_status' => 'sending',
            'delivery_attempted_at' => now(),
            'delivery_error' => null,
            'delivered_at' => null,
        ])->save();

        try {
            if ($channel === 'in_app') {
                $count = $this->notifications->notifyCommunication($communication->loadMissing('school'));
                $communication->forceFill([
                    'delivery_status' => $count > 0 ? 'delivered' : 'no_recipients',
                    'delivery_recipient_count' => $count,
                    'delivered_at' => now(),
                ])->save();
                return;
            }

            $count = $this->externalDeliveries->queueForCommunication($communication->loadMissing('school'), $channel);
            $communication->forceFill([
                'delivery_status' => $count > 0 ? 'queued' : 'no_recipients',
                'delivery_recipient_count' => $count,
            ])->save();
        } catch (Throwable $exception) {
            report($exception);
            $communication->forceFill([
                'delivery_status' => 'failed',
                'delivery_recipient_count' => 0,
                'delivery_error' => substr($exception->getMessage(), 0, 2000),
            ])->save();
        }
    }

    private function ensureCanManage(Request $request, Communication $communication): int
    {
        $schoolId = $this->ensureSchool($request, $communication);
        $user = $request->user();

        if ($user->isSuperAdmin() || $user->hasRole('proprietor', $schoolId)) {
            return $schoolId;
        }

        $hasManagementRole = collect(self::MANAGEMENT_ROLES)
            ->contains(fn (string $role) => $user->hasRole($role, $schoolId));

        abort_unless($hasManagementRole || (int) $communication->sender_id === (int) $user->id, 403, 'You may only manage communications created by you unless you are school leadership.');

        return $schoolId;
    }

    private function ensureSchool(Request $request, Communication $communication): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $communication->school_id === $schoolId, 404);

        return $schoolId;
    }

    private function audiencesFor($user, int $schoolId): array
    {
        $roles = collect($this->context->resolve($user)['roles'] ?? [])
            ->filter(fn (array $role) => (int) ($role['school_id'] ?? 0) === $schoolId)
            ->pluck('slug')
            ->unique()
            ->values();

        $audiences = [];

        if ($roles->contains('parent')) {
            $audiences[] = 'parents';
        }

        if ($roles->contains('student')) {
            $audiences[] = 'students';
        }

        if ($roles->diff(['parent', 'student'])->isNotEmpty()) {
            $audiences[] = 'staff';
        }

        return $audiences ?: ['staff'];
    }
}

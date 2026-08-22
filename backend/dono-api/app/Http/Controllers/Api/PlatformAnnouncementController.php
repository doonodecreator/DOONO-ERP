<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PlatformAnnouncementMail;
use App\Mail\PlatformTestMail;
use App\Models\PlatformAnnouncement;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\EmailDeliveryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class PlatformAnnouncementController extends Controller
{
    public function __construct(private EmailDeliveryService $delivery) {}

    public function index()
    {
        return response()->json([
            'data' => PlatformAnnouncement::with('creator:id,name,email')->latest()->paginate(20),
        ]);
    }

    public function previewRecipients(Request $request)
    {
        $data = $this->validatedAudience($request);
        $query = $this->recipientQuery($data);
        return response()->json([
            'data' => [
                'count' => (clone $query)->count(),
                'sample' => (clone $query)->limit(10)->get(['id', 'name', 'email']),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validatedAnnouncement($request);
        $recipientCount = $this->recipientQuery($data)->count();
        $announcement = PlatformAnnouncement::create([
            ...$data,
            'created_by' => $request->user()->id,
            'status' => 'draft',
            'recipient_count' => $recipientCount,
        ]);

        ActivityLogService::log(module: 'platform_announcements', action: 'created', description: "Platform announcement '{$announcement->subject}' was drafted for {$recipientCount} verified recipients.", subject: $announcement, properties: ['recipient_count' => $recipientCount, 'audience' => $announcement->audience, 'target_role' => $announcement->target_role, 'target_school_ids' => $announcement->target_school_ids]);
        return response()->json(['data' => $announcement->load('creator:id,name,email'), 'message' => 'Announcement saved as a draft.'], 201);
    }

    public function update(Request $request, PlatformAnnouncement $platformAnnouncement)
    {
        abort_unless($platformAnnouncement->status === 'draft', 409, 'Only draft announcements can be edited.');
        $data = $this->validatedAnnouncement($request, true);
        $recipientCount = $this->recipientQuery([...$platformAnnouncement->toArray(), ...$data])->count();
        $platformAnnouncement->update([...$data, 'recipient_count' => $recipientCount]);
        ActivityLogService::log(module: 'platform_announcements', action: 'updated', description: "Platform announcement '{$platformAnnouncement->subject}' was updated.", subject: $platformAnnouncement, properties: ['recipient_count' => $recipientCount]);
        return response()->json(['data' => $platformAnnouncement->fresh()->load('creator:id,name,email'), 'message' => 'Announcement updated.']);
    }

    public function destroy(PlatformAnnouncement $platformAnnouncement)
    {
        abort_unless($platformAnnouncement->status === 'draft', 409, 'Only draft announcements can be deleted.');
        $platformAnnouncement->delete();
        ActivityLogService::log(module: 'platform_announcements', action: 'deleted', description: 'A platform announcement draft was deleted.', subject: $platformAnnouncement);
        return response()->json(['message' => 'Announcement deleted.']);
    }

    public function send(Request $request, PlatformAnnouncement $platformAnnouncement)
    {
        abort_unless($platformAnnouncement->status === 'draft', 409, 'Only draft announcements can be sent.');
        $recipientCount = 0;
        $this->recipientQuery($platformAnnouncement->toArray())
            ->select(['id', 'name', 'email'])
            ->orderBy('id')
            ->chunkById(50, function ($users) use ($platformAnnouncement, &$recipientCount) {
                foreach ($users as $user) {
                    $actionData = [];
                    if ($platformAnnouncement->action_url) {
                        $actionData = ['action_url' => $platformAnnouncement->action_url, 'action_label' => $platformAnnouncement->action_label ?: 'Open DONO School ERP'];
                    }
                    $this->delivery->deliverOne(
                        user: $user,
                        email: $user->email,
                        messageType: 'platform_announcement',
                        subject: $platformAnnouncement->subject,
                        bodyText: $platformAnnouncement->body.($platformAnnouncement->action_url ? "\n\n{$platformAnnouncement->action_label}: {$platformAnnouncement->action_url}" : ''),
                        actionData: $actionData,
                        mailable: new PlatformAnnouncementMail($platformAnnouncement),
                    );
                    $recipientCount++;
                }
            });

        $platformAnnouncement->update(['status' => 'sent', 'recipient_count' => $recipientCount, 'sent_at' => now()]);
        ActivityLogService::log(module: 'platform_announcements', action: 'sent', description: "Platform announcement '{$platformAnnouncement->subject}' was sent to {$recipientCount} verified users.", subject: $platformAnnouncement, properties: ['recipient_count' => $recipientCount, 'local_email_mode' => $this->delivery->isLocalMode()]);
        return response()->json(['data' => $platformAnnouncement->fresh(), 'message' => $this->delivery->isLocalMode() ? "Announcement saved to the local Test Inbox for {$recipientCount} verified users." : "Announcement sent to {$recipientCount} verified users."]);
    }

    public function emailStatus()
    {
        $mailer = (string) config('mail.default');
        $fromAddress = (string) config('mail.from.address');
        $smtpHost = (string) config('mail.mailers.smtp.host');
        return response()->json(['data' => [
            'mailer' => $mailer,
            'from_address' => $fromAddress,
            'from_name' => config('mail.from.name'),
            'local_email_mode' => $this->delivery->isLocalMode(),
            'configured' => $this->delivery->isLocalMode() || ($mailer !== 'log' && $mailer !== 'array' && $fromAddress !== 'hello@example.com'),
            'smtp_host_configured' => $smtpHost !== '' && $smtpHost !== '127.0.0.1',
        ]]);
    }

    public function testEmail(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $email = strtolower(trim($data['email']));
        $user = User::where('email', $email)->first();
        $this->delivery->deliverOne(
            user: $user,
            email: $email,
            messageType: 'platform_test',
            subject: 'DONO School ERP test email',
            bodyText: "This is a local DONO test email for {$email}.",
            mailable: new PlatformTestMail($email),
        );
        ActivityLogService::log(module: 'platform_email', action: 'test_sent', description: "A platform test email was sent to {$email}.");
        return response()->json(['message' => $this->delivery->isLocalMode() ? 'Test message saved to the local Test Inbox.' : 'Test email sent successfully. Check the recipient inbox and spam folder.']);
    }

    private function validatedAnnouncement(Request $request, bool $sometimes = false): array
    {
        $prefix = $sometimes ? 'sometimes|' : '';
        $data = $request->validate([
            'subject' => [$prefix.'required', 'string', 'max:255'],
            'body' => [$prefix.'required', 'string', 'max:50000'],
            'action_url' => ['nullable', 'url', 'max:2048'],
            'action_label' => ['nullable', 'string', 'max:80'],
            'audience' => [$prefix.'in:all,role,school,users,role_school'],
            'target_role' => ['nullable', 'string', 'max:80'],
            'target_school_ids' => ['nullable', 'array', 'max:100'],
            'target_school_ids.*' => ['integer', 'exists:schools,id'],
            'target_user_ids' => ['nullable', 'array', 'max:500'],
            'target_user_ids.*' => ['integer', 'exists:users,id'],
        ]);
        return $this->normaliseAudience($data);
    }

    private function validatedAudience(Request $request): array
    {
        return $this->normaliseAudience($request->validate([
            'audience' => ['required', 'in:all,role,school,users,role_school'],
            'target_role' => ['nullable', 'string', 'max:80'],
            'target_school_ids' => ['nullable', 'array', 'max:100'],
            'target_school_ids.*' => ['integer', 'exists:schools,id'],
            'target_user_ids' => ['nullable', 'array', 'max:500'],
            'target_user_ids.*' => ['integer', 'exists:users,id'],
        ]));
    }

    private function normaliseAudience(array $data): array
    {
        $data['audience'] = $data['audience'] ?? 'all';
        $data['target_school_ids'] = array_values(array_unique(array_map('intval', $data['target_school_ids'] ?? [])));
        $data['target_user_ids'] = array_values(array_unique(array_map('intval', $data['target_user_ids'] ?? [])));
        return $data;
    }

    private function recipientQuery(array $data): Builder
    {
        $audience = $data['audience'] ?? 'all';
        $role = $data['target_role'] ?? null;
        $schoolIds = array_values(array_filter(array_map('intval', $data['target_school_ids'] ?? [])));
        $userIds = array_values(array_filter(array_map('intval', $data['target_user_ids'] ?? [])));

        $query = User::query()->whereNotNull('email')->whereNotNull('email_verified_at');
        if ($audience === 'users') {
            return $query->whereIn('users.id', $userIds ?: [0]);
        }
        if (in_array($audience, ['role', 'role_school'], true)) {
            $query->whereHas('roles', function ($roleQuery) use ($role, $schoolIds) {
                $roleQuery->where('roles.slug', $role ?: '');
                if ($schoolIds) $roleQuery->whereIn('user_roles.school_id', $schoolIds);
            });
            return $query;
        }
        if ($audience === 'school') {
            return $query->where(function ($schoolQuery) use ($schoolIds) {
                $schoolQuery->whereHas('roles', fn ($roleQuery) => $roleQuery->whereIn('user_roles.school_id', $schoolIds ?: [0]))
                    ->orWhereHas('ownedSchools', fn ($ownedQuery) => $ownedQuery->whereIn('schools.id', $schoolIds ?: [0]));
            });
        }
        return $query;
    }
}

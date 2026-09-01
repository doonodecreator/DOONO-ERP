<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\SupportAttachmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupportTicketController extends Controller
{
    private const STATUSES = ['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed'];
    private const CATEGORIES = ['general', 'account_access', 'billing', 'academic', 'finance', 'technical', 'security', 'data_request'];
    private const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
    private const CANNED_REPLIES = [
        'payment_verification' => 'Please provide the payment reference and approximate payment time. Do not send card details or PINs.',
        'account_recovery' => 'Please confirm the account email and the exact sign-in message. Never send your password or one-time code.',
        'more_information' => 'Please attach a screenshot or exact error text and describe the steps that led to the problem.',
    ];

    public function __construct(private CurrentContextService $context, private SupportAttachmentService $attachments) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = SupportTicket::with(['creator:id,name,email', 'assignee:id,name,email', 'school:id,name']);
        $visibility = $this->visibilityQuery($user);
        if ($visibility) {
            $query->where($visibility);
        }

        $query
            ->when($request->filled('status'), fn ($builder) => $builder->where('status', $request->input('status')))
            ->when($request->filled('category'), fn ($builder) => $builder->where('category', $request->input('category')))
            ->when($request->filled('search'), function ($builder) use ($request) {
                $search = trim((string) $request->input('search'));
                $builder->where(function ($nested) use ($search) {
                    $nested->where('ticket_number', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->latest('updated_at');

        return response()->json([
            'data' => $query->paginate($this->perPage($request)),
            'meta' => [
                'categories' => self::CATEGORIES,
                'priorities' => self::PRIORITIES,
                'statuses' => self::STATUSES,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:180'],
            'category' => ['required', 'in:' . implode(',', self::CATEGORIES)],
            'priority' => ['required', 'in:' . implode(',', self::PRIORITIES)],
            'description' => ['required', 'string', 'min:10', 'max:10000'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,txt,doc,docx,xls,xlsx,png,jpg,jpeg,webp', 'max:10240'],
        ]);

        $user = $request->user();
        $school = $this->context->currentSchool($user);
        $organization = $this->context->currentOrganization($user, $school);

        $ticket = DB::transaction(function () use ($validated, $user, $school, $organization, $request) {
            $ticket = SupportTicket::create([
                'organization_id' => $organization?->id,
                'school_id' => $school?->id,
                'created_by' => $user->id,
                'ticket_number' => $this->nextTicketNumber(),
                'subject' => trim($validated['subject']),
                'category' => $validated['category'],
                'priority' => $validated['priority'],
                'status' => 'open',
                'description' => trim($validated['description']),
                'first_response_due_at' => now()->addHours($this->slaHours($validated['priority'])),
                'resolution_due_at' => now()->addHours($this->slaHours($validated['priority']) * 4),
            ]);

            $attachment = $request->hasFile('attachment') ? $this->attachments->store($request->file('attachment'), $ticket->id) : [];
            $ticket->messages()->create([
                'user_id' => $user->id,
                'body' => trim($validated['description']),
                'is_internal_note' => false,
                ...$attachment,
            ]);

            ActivityLogService::log(
                module: 'support',
                action: 'ticket_created',
                description: "Support ticket {$ticket->ticket_number} was created.",
                subject: $ticket,
                properties: ['category' => $ticket->category, 'priority' => $ticket->priority],
                schoolId: $school?->id,
            );

            return $ticket;
        });

        return response()->json(['data' => $this->loadTicket($ticket, $user), 'message' => 'Support request submitted.'], 201);
    }

    public function show(Request $request, SupportTicket $supportTicket)
    {
        $this->ensureVisible($request->user(), $supportTicket);

        return response()->json(['data' => $this->loadTicket($supportTicket, $request->user())]);
    }

    public function reply(Request $request, SupportTicket $supportTicket)
    {
        $user = $request->user();
        $this->ensureVisible($user, $supportTicket);

        $validated = $request->validate([
            'body' => ['nullable', 'string', 'min:2', 'max:10000', 'required_without:canned_reply_key'],
            'is_internal_note' => ['sometimes', 'boolean'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,txt,doc,docx,xls,xlsx,png,jpg,jpeg,webp', 'max:10240'],
            'canned_reply_key' => ['nullable', 'in:' . implode(',', array_keys(self::CANNED_REPLIES))],
        ]);
        abort_if(! empty($validated['canned_reply_key']) && ! $user->isSuperAdmin(), 403, 'Only authorized support administrators can use canned replies.');
        $internal = $user->isSuperAdmin() && (bool) ($validated['is_internal_note'] ?? false);
        $body = trim((string) ($validated['body'] ?? '')) ?: self::CANNED_REPLIES[$validated['canned_reply_key']];

        DB::transaction(function () use ($supportTicket, $user, $validated, $internal, $body, $request) {
            $supportTicket->messages()->create([
                'user_id' => $user->id,
                'body' => $body,
                'is_internal_note' => $internal,
                'canned_reply_key' => $validated['canned_reply_key'] ?? null,
                ...($request->hasFile('attachment') ? $this->attachments->store($request->file('attachment'), $supportTicket->id) : []),
            ]);

            if (!$internal) {
                $supportTicket->forceFill([
                    'status' => $user->isSuperAdmin() ? 'waiting_on_user' : 'in_progress',
                    'first_response_due_at' => $user->isSuperAdmin() ? null : $supportTicket->first_response_due_at,
                    'last_replied_at' => now(),
                    'resolved_at' => null,
                ])->save();
            }

            ActivityLogService::log(
                module: 'support',
                action: $internal ? 'internal_note_added' : 'ticket_replied',
                description: "Support ticket {$supportTicket->ticket_number} received a reply.",
                subject: $supportTicket,
                properties: ['internal' => $internal],
                schoolId: $supportTicket->school_id,
            );
        });

        return response()->json(['data' => $this->loadTicket($supportTicket->fresh(), $user), 'message' => 'Reply added.']);
    }

    public function updateStatus(Request $request, SupportTicket $supportTicket)
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'Only the Software Owner can change support ticket status.');
        $validated = $request->validate([
            'status' => ['required', 'in:' . implode(',', self::STATUSES)],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $supportTicket->update([
            'status' => $validated['status'],
            'assigned_to' => $validated['assigned_to'] ?? $supportTicket->assigned_to,
            'resolved_at' => in_array($validated['status'], ['resolved', 'closed'], true) ? now() : null,
        ]);

        ActivityLogService::log(
            module: 'support',
            action: 'ticket_status_changed',
            description: "Support ticket {$supportTicket->ticket_number} changed to {$supportTicket->status}.",
            subject: $supportTicket,
            properties: ['status' => $supportTicket->status, 'assigned_to' => $supportTicket->assigned_to],
            schoolId: $supportTicket->school_id,
        );

        return response()->json(['data' => $this->loadTicket($supportTicket->fresh(), $request->user()), 'message' => 'Support ticket updated.']);
    }

    private function loadTicket(SupportTicket $ticket, $viewer = null): SupportTicket
    {
        $includeInternalNotes = $viewer?->isSuperAdmin() === true;

        return $ticket->load([
            'creator:id,name,email',
            'assignee:id,name,email',
            'school:id,name',
            'organization:id,name',
            'messages' => function ($query) use ($includeInternalNotes) {
                if (!$includeInternalNotes) {
                    $query->where('is_internal_note', false);
                }
                $query->latest('created_at');
            },
            'messages.user:id,name,email',
        ]);
    }

    private function visibilityQuery($user): array
    {
        if ($user->isSuperAdmin()) {
            return [];
        }

        $school = $this->context->currentSchool($user);
        $organization = $this->context->currentOrganization($user, $school);

        if ($school && $this->mayViewSchoolTickets($user, $school, $organization)) {
            return ['school_id' => $school->id];
        }

        if (!$school && $organization) {
            return ['organization_id' => $organization->id];
        }

        return ['created_by' => $user->id];
    }

    private function ensureVisible($user, SupportTicket $ticket): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        $filters = $this->visibilityQuery($user);
        $visible = isset($filters['school_id'])
            ? (int) $ticket->school_id === (int) $filters['school_id']
            : (isset($filters['organization_id'])
                ? (int) $ticket->organization_id === (int) $filters['organization_id']
                : (int) $ticket->created_by === (int) $filters['created_by']);

        abort_unless($visible, 403, 'You cannot access this support request.');
    }

    private function mayViewSchoolTickets($user, $school, $organization): bool
    {
        if ($organization?->owner_id === $user->id) {
            return true;
        }

        return collect(['proprietor', 'principal', 'vice_principal_academic', 'vice_principal_admin'])
            ->contains(fn (string $role) => $user->hasRole($role, $school->id));
    }

    private function nextTicketNumber(): string
    {
        do {
            $number = 'DO-' . now()->format('ymd') . '-' . strtoupper(Str::random(6));
        } while (SupportTicket::where('ticket_number', $number)->exists());

        return $number;
    }

    public function cannedReplies(Request $request)
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'Only authorized support administrators can view canned replies.');
        return response()->json(['data' => collect(self::CANNED_REPLIES)->map(fn (string $body, string $key) => ['key' => $key, 'body' => $body])->values()]);
    }

    private function slaHours(string $priority): int
    {
        return match ($priority) {
            'urgent' => 4,
            'high' => 24,
            'low' => 120,
            default => 72,
        };
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 15), 1), 100);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicketMessage;
use App\Services\CurrentContextService;
use App\Services\SupportAttachmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class SupportTicketAttachmentController extends Controller
{
    public function __construct(private CurrentContextService $context, private SupportAttachmentService $attachments) {}

    public function url(Request $request, SupportTicketMessage $message)
    {
        $this->authorizeMessage($request, $message);
        $expiresAt = now()->addMinutes(10);
        return response()->json(['data' => ['url' => URL::temporarySignedRoute('support-attachments.download', $expiresAt, ['message' => $message->id]), 'expires_at' => $expiresAt->toIso8601String()]]);
    }

    public function download(Request $request, SupportTicketMessage $message)
    {
        $this->authorizeMessage($request, $message);
        return $this->attachments->download($message->attachment_path);
    }

    private function authorizeMessage(Request $request, SupportTicketMessage $message): void
    {
        $ticket = $message->ticket;
        abort_unless($ticket, 404, 'Support ticket not found.');
        $user = $request->user();
        if (! $user->isSuperAdmin()) {
            $school = $this->context->currentSchool($user);
            $organization = $this->context->currentOrganization($user, $school);
            $visible = ($school && (int) $ticket->school_id === (int) $school->id && ($organization?->owner_id === $user->id || collect(['proprietor', 'principal', 'vice_principal_academic', 'vice_principal_admin'])->contains(fn (string $role) => $user->hasRole($role, $school->id))))
                || ($school && (int) $ticket->school_id === (int) $school->id && (int) $ticket->created_by === (int) $user->id)
                || (! $school && $organization && (int) $ticket->organization_id === (int) $organization->id && (int) $ticket->created_by === (int) $user->id);
            abort_unless($visible, 403, 'You cannot access this support attachment.');
        }
        abort_unless($message->is_internal_note === false || $user->isSuperAdmin(), 404, 'Attachment not found.');
        abort_unless($message->attachment_path, 404, 'Attachment not found.');
    }
}

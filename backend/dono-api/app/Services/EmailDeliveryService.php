<?php

namespace App\Services;

use App\Models\LocalEmailMessage;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;

class EmailDeliveryService
{
    public function isLocalMode(): bool
    {
        return (bool) (SystemSetting::query()->value('local_email_mode') ?? true);
    }

    public function deliverOne(
        ?User $user,
        string $email,
        string $messageType,
        string $subject,
        string $bodyText,
        array $actionData = [],
        ?Mailable $mailable = null,
    ): void {
        if ($this->isLocalMode()) {
            LocalEmailMessage::create([
                'recipient_user_id' => $user?->id,
                'recipient_email' => strtolower(trim($email)),
                'message_type' => $messageType,
                'subject' => $subject,
                'body_text' => $bodyText,
                'body_html' => nl2br(e($bodyText)),
                'action_data' => $actionData,
            ]);
            return;
        }

        if ($mailable) {
            Mail::to($email)->send($mailable);
        }
    }
}

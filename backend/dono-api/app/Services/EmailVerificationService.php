<?php

namespace App\Services;

use App\Mail\VerifyEmailMail;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Throwable;

class EmailVerificationService
{
    public function __construct(private EmailDeliveryService $delivery) {}

    public function send(User $user): bool
    {
        try {
            $url = URL::temporarySignedRoute('verification.verify', now()->addHours(24), [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ], ! $this->delivery->isLocalMode());
            $this->delivery->deliverOne(
                user: $user,
                email: $user->email,
                messageType: 'email_verification',
                subject: 'Verify your DONO School ERP email address',
                bodyText: "Hello {$user->name},\n\nVerify your email address here:\n{$url}\n\nThis link expires in 24 hours.",
                actionData: ['action_url' => $url, 'action_label' => 'Verify email address'],
                mailable: new VerifyEmailMail($user),
            );
            return true;
        } catch (Throwable $exception) {
            report($exception);
            return false;
        }
    }
}

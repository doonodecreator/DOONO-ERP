<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Facades\URL;

class VerifyEmailMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Verify your DONO School ERP email address');
    }

    public function content(): Content
    {
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addHours(24),
            [
                'id' => $this->user->getKey(),
                'hash' => sha1($this->user->getEmailForVerification()),
            ]
        );

        return new Content(
            markdown: 'emails.verify-email',
            with: ['verificationUrl' => $verificationUrl, 'user' => $this->user],
        );
    }
}

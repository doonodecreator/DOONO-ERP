<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PasswordResetMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public function __construct(public User $user, public string $token) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Reset your DONO School ERP password');
    }

    public function content(): Content
    {
        $frontendUrl = rtrim((string) env('FRONTEND_URL', config('app.url')), '/');
        $resetUrl = $frontendUrl.'/forgot-password/reset?token='.urlencode($this->token).'&email='.urlencode($this->user->email);

        return new Content(
            markdown: 'emails.password-reset',
            with: ['resetUrl' => $resetUrl, 'user' => $this->user],
        );
    }
}

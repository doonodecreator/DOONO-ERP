<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PlatformTestMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $recipient) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'DONO School ERP test email');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.platform-test',
            with: ['recipient' => $this->recipient],
        );
    }
}

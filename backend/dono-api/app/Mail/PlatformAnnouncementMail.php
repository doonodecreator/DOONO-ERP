<?php

namespace App\Mail;

use App\Models\PlatformAnnouncement;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PlatformAnnouncementMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public function __construct(public PlatformAnnouncement $announcement) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->announcement->subject);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.platform-announcement',
            with: ['announcement' => $this->announcement],
        );
    }
}

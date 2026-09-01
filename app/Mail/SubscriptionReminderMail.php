<?php

namespace App\Mail;

use App\Models\SchoolSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public SchoolSubscription $subscription;

    public int $daysRemaining;

    /**
     * Create a new message instance.
     */
    public function __construct(
        SchoolSubscription $subscription,
        int $daysRemaining
    ) {
        $this->subscription = $subscription;
        $this->daysRemaining = $daysRemaining;
    }

    /**
     * Message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your DONO ERP Subscription Expires in {$this->daysRemaining} Day(s)"
        );
    }

    /**
     * Message content.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-reminder',
        );
    }

    /**
     * Attachments.
     */
    public function attachments(): array
    {
        return [];
    }
}

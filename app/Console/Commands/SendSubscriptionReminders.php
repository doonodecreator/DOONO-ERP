<?php

namespace App\Console\Commands;

use App\Mail\SubscriptionReminderMail;
use App\Models\SchoolSubscription;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

#[Signature('subscriptions:reminders')]
#[Description('Send subscription renewal reminders')]
class SendSubscriptionReminders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $subscriptions = SchoolSubscription::with([
            'school',
            'subscriptionPlan',
        ])
        ->where('status', 'active')
        ->where('is_current', true)
        ->get();

        foreach ($subscriptions as $subscription) {

            $daysRemaining = $subscription->daysRemaining();

            /*
            |--------------------------------------------------------------------------
            | 7 Days Reminder
            |--------------------------------------------------------------------------
            */

            if (
                $daysRemaining === 7 &&
                !$subscription->first_reminder_sent_at
            ) {

                Mail::to($subscription->school->email)
                    ->send(
                        new SubscriptionReminderMail(
                            $subscription,
                            $daysRemaining
                        )
                    );

                Log::info(
                    "7-day reminder sent to {$subscription->school->email}"
                );

                $subscription->update([
                    'first_reminder_sent_at' => now(),
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | 3 Days Reminder
            |--------------------------------------------------------------------------
            */

            if (
                $daysRemaining === 3 &&
                !$subscription->second_reminder_sent_at
            ) {

                Mail::to($subscription->school->email)
                    ->send(
                        new SubscriptionReminderMail(
                            $subscription,
                            $daysRemaining
                        )
                    );

                Log::info(
                    "3-day reminder sent to {$subscription->school->email}"
                );

                $subscription->update([
                    'second_reminder_sent_at' => now(),
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Final Reminder
            |--------------------------------------------------------------------------
            */

            if (
                $daysRemaining === 1 &&
                !$subscription->final_reminder_sent_at
            ) {

                Mail::to($subscription->school->email)
                    ->send(
                        new SubscriptionReminderMail(
                            $subscription,
                            $daysRemaining
                        )
                    );

                Log::info(
                    "Final reminder sent to {$subscription->school->email}"
                );

                $subscription->update([
                    'final_reminder_sent_at' => now(),
                ]);
            }
        }

        $this->info('Subscription reminders processed successfully.');

        return self::SUCCESS;
    }
}

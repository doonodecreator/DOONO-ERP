<?php

namespace App\Console\Commands;

use App\Models\SchoolSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ExpireSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'subscriptions:expire';

    /**
     * The console command description.
     */
    protected $description = 'Automatically expire subscriptions that have reached their expiry date';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $subscriptions = SchoolSubscription::where('is_current', true)
            ->whereIn('status', ['active', 'trial'])
            ->whereDate('expiry_date', '<', now())
            ->get();

        if ($subscriptions->isEmpty()) {

            $this->info('No expired subscriptions found.');

            return self::SUCCESS;
        }

        foreach ($subscriptions as $subscription) {

            $subscription->update([
                'status' => 'expired',
            ]);

            Log::info('Subscription expired automatically.', [
                'subscription_id' => $subscription->id,
                'school_id' => $subscription->school_id,
            ]);

            $this->line(
                "Expired subscription #{$subscription->id}"
            );
        }

        $this->info(
            "{$subscriptions->count()} subscription(s) expired successfully."
        );

        return self::SUCCESS;
    }
}

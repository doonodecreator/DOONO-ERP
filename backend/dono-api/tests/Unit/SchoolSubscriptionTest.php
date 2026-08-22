<?php

namespace Tests\Unit;

use App\Models\SchoolSubscription;
use Carbon\Carbon;
use Tests\TestCase;

class SchoolSubscriptionTest extends TestCase
{
    public function test_active_subscription_expires_after_the_end_of_the_expiry_day(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 12:00:00'));

        $subscription = new SchoolSubscription([
            'status' => 'active',
            'expiry_date' => '2026-08-21',
        ]);

        $this->assertTrue($subscription->isExpired());
        $this->assertFalse($subscription->isActive());
    }

    public function test_active_subscription_remains_valid_through_the_expiry_day(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 23:59:59'));

        $subscription = new SchoolSubscription([
            'status' => 'active',
            'expiry_date' => '2026-08-22',
        ]);

        $this->assertFalse($subscription->isExpired());
        $this->assertTrue($subscription->isActive());
    }

    public function test_trial_is_active_until_the_end_of_its_trial_day(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 18:30:00'));

        $subscription = new SchoolSubscription([
            'status' => 'trial',
            'trial_ends_at' => '2026-08-22',
            'expiry_date' => '2026-08-22',
        ]);

        $this->assertTrue($subscription->isTrial());
        $this->assertTrue($subscription->isActive());
    }
}

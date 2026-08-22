<?php

namespace Tests\Unit;

use App\Models\SchoolSubscription;
use App\Models\SubscriptionPlan;
use App\Services\SubscriptionAccessService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Tests\TestCase;

class SubscriptionAccessServiceTest extends TestCase
{
    public function test_free_core_feature_is_available_without_a_subscription(): void
    {
        $service = new SubscriptionAccessService();

        $this->assertTrue($service->allows(null, 'students', true));
    }

    public function test_paid_feature_is_available_when_the_plan_contains_it(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 12:00:00'));

        $plan = new SubscriptionPlan(['features' => ['fees']]);
        $plan->setRelation('featureModels', new Collection());

        $subscription = new SchoolSubscription([
            'status' => 'active',
            'expiry_date' => '2026-08-31',
        ]);
        $subscription->setRelation('subscriptionPlan', $plan);

        $service = new SubscriptionAccessService();

        $this->assertTrue($service->allows($subscription, 'fees', true));
        $this->assertFalse($service->allows($subscription, 'accounting', true));
    }

    public function test_expired_subscription_cannot_unlock_paid_features(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 12:00:00'));

        $plan = new SubscriptionPlan(['features' => ['fees']]);
        $plan->setRelation('featureModels', new Collection());

        $subscription = new SchoolSubscription([
            'status' => 'active',
            'expiry_date' => '2026-08-21',
        ]);
        $subscription->setRelation('subscriptionPlan', $plan);

        $this->assertFalse((new SubscriptionAccessService())->allows($subscription, 'fees', true));
    }
}

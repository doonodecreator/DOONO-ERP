<?php

namespace App\Services;

use App\Models\SchoolSubscription;
use App\Models\Staff;
use App\Models\Student;
use App\Models\SystemSetting;
use Illuminate\Validation\ValidationException;

class SubscriptionQuotaService
{
    public function assertCanAddStudent(int $schoolId): void
    {
        $subscription = $this->billableSubscription($schoolId);
        $limit = $subscription?->subscriptionPlan?->max_students;

        if ($limit === null || (int) $limit < 0) {
            return;
        }

        $current = Student::query()->where('school_id', $schoolId)->count();
        if ($current >= (int) $limit) {
            throw ValidationException::withMessages([
                'subscription' => ["This school has reached its plan limit of {$limit} students. Upgrade the subscription to add more students."],
            ]);
        }
    }

    public function assertCanAddStaff(int $schoolId): void
    {
        $subscription = $this->billableSubscription($schoolId);
        $limit = $subscription?->subscriptionPlan?->max_staff;

        if ($limit === null || (int) $limit < 0) {
            return;
        }

        $current = Staff::query()
            ->where('school_id', $schoolId)
            ->whereNotIn('employment_status', ['Terminated', 'Resigned', 'Retired'])
            ->count();

        if ($current >= (int) $limit) {
            throw ValidationException::withMessages([
                'subscription' => ["This school has reached its plan limit of {$limit} staff members. Upgrade the subscription to add more staff."],
            ]);
        }
    }

    private function billableSubscription(int $schoolId): ?SchoolSubscription
    {
        if (! (bool) (SystemSetting::first()?->enforce_subscriptions ?? false)) {
            return null;
        }

        $subscription = SchoolSubscription::with('subscriptionPlan')
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->latest('id')
            ->first();

        if (! $subscription?->isActive()) {
            return null;
        }

        if ($subscription->is_exempt || ($subscription->discount_percentage >= 100 && $subscription->hasActiveDiscount())) {
            return null;
        }

        return $subscription;
    }
}

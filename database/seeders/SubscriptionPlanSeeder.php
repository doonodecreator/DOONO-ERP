<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SubscriptionPlan::updateOrCreate(
            ['slug' => 'basic'],
            [
                'name' => 'Basic',

                'description' => 'Basic subscription plan',

                'monthly_price' => 10,

                'quarterly_price' => 27,

                'half_yearly_price' => 50,

                'yearly_price' => 95,

                'currency' => 'USD',

                'max_students' => 200,

                'max_staff' => 30,

                'max_branches' => 1,

                'trial_days' => 240,

                'features' => [
                    'students',
                    'attendance',
                    'results',
                    'fees',
                    'report_cards'
                ],

                'is_active' => true,
            ]
        );

        SubscriptionPlan::updateOrCreate(
            ['slug' => 'standard'],
            [
                'name' => 'Standard',

                'description' => 'Standard subscription plan',

                'monthly_price' => 25,

                'quarterly_price' => 70,

                'half_yearly_price' => 130,

                'yearly_price' => 250,

                'currency' => 'USD',

                'max_students' => 1000,

                'max_staff' => 100,

                'max_branches' => 5,

                'trial_days' => 240,

                'features' => [
                    'students',
                    'attendance',
                    'results',
                    'fees',
                    'report_cards',
                    'cbt',
                    'library',
                    'transport',
                    'sms'
                ],

                'is_active' => true,
            ]
        );

        SubscriptionPlan::updateOrCreate(
            ['slug' => 'premium'],
            [
                'name' => 'Premium',

                'description' => 'Premium subscription plan',

                'monthly_price' => 50,

                'quarterly_price' => 145,

                'half_yearly_price' => 280,

                'yearly_price' => 540,

                'currency' => 'USD',

                // -1 means Unlimited
                'max_students' => -1,

                'max_staff' => -1,

                'max_branches' => -1,

                'trial_days' => 240,

                'features' => [
                    '*'
                ],

                'is_active' => true,
            ]
        );
    }
}

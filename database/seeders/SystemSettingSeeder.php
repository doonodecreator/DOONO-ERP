<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemSetting;
use App\Models\SubscriptionPlan;
use App\Models\Currency;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $premium = SubscriptionPlan::where('slug', 'premium')->first();

        $usd = Currency::where('code', 'USD')->first();

        SystemSetting::updateOrCreate(

            ['id' => 1],

            [

                'platform_name' => 'DOONO School ERP',

                'platform_email' => 'support@doono.com',

                'platform_phone' => '+234000000000',

                'platform_logo' => null,

                /*
                |--------------------------------------------------------------------------
                | Free Trial
                |--------------------------------------------------------------------------
                */

                'trial_days' => 240,

                'default_subscription_plan_id' => $premium?->id,

                /*
                |--------------------------------------------------------------------------
                | Default Currency
                |--------------------------------------------------------------------------
                */

                'default_currency_id' => $usd?->id,

                /*
                |--------------------------------------------------------------------------
                | Registration
                |--------------------------------------------------------------------------
                */

                'allow_school_registration' => true,

                /*
                |--------------------------------------------------------------------------
                | Maintenance
                |--------------------------------------------------------------------------
                */

                'maintenance_mode' => false,

                /*
                |--------------------------------------------------------------------------
                | Payment
                |--------------------------------------------------------------------------
                */

                'paystack_enabled' => true,

                'stripe_enabled' => true,

                /*
                |--------------------------------------------------------------------------
                | Notifications
                |--------------------------------------------------------------------------
                */

                'email_notifications' => true,

                'sms_notifications' => false,
            ]
        );
    }
}

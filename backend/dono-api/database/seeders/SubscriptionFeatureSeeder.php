<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Feature;
use App\Models\SubscriptionPlan;

class SubscriptionFeatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $basic = SubscriptionPlan::where('slug', 'basic')->first();
        $standard = SubscriptionPlan::where('slug', 'standard')->first();
        $premium = SubscriptionPlan::where('slug', 'premium')->first();

        if (!$basic || !$standard || !$premium) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Basic Features
        |--------------------------------------------------------------------------
        */

        $basicFeatures = [

            'students',

            'attendance',

            'results',

            'fees',

            'report_cards',
        ];

        /*
        |--------------------------------------------------------------------------
        | Standard Features
        |--------------------------------------------------------------------------
        */

        $standardFeatures = array_merge(
            $basicFeatures,
            [

                'cbt',

                'library',

                'transport',

                'sms',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Premium Features
        |--------------------------------------------------------------------------
        */

        $premiumFeatures = Feature::pluck('id')->toArray();

        /*
        |--------------------------------------------------------------------------
        | Attach Basic
        |--------------------------------------------------------------------------
        */

        $basic->featureModels()->sync(
            Feature::whereIn('slug', $basicFeatures)
                ->pluck('id')
                ->mapWithKeys(fn ($id) => [
                    $id => ['is_enabled' => true]
                ])
                ->toArray()
        );

        /*
        |--------------------------------------------------------------------------
        | Attach Standard
        |--------------------------------------------------------------------------
        */

        $standard->featureModels()->sync(
            Feature::whereIn('slug', $standardFeatures)
                ->pluck('id')
                ->mapWithKeys(fn ($id) => [
                    $id => ['is_enabled' => true]
                ])
                ->toArray()
        );

        /*
        |--------------------------------------------------------------------------
        | Attach Premium
        |--------------------------------------------------------------------------
        */

        $premium->featureModels()->sync(
            collect($premiumFeatures)
                ->mapWithKeys(fn ($id) => [
                    $id => ['is_enabled' => true]
                ])
                ->toArray()
        );
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            AdditionalRoleSeeder::class,
            CountrySeeder::class,
            CurrencySeeder::class,
            FeatureSeeder::class,
            SubscriptionPlanSeeder::class,
            SubscriptionFeatureSeeder::class,
            ClassSeeder::class,
            SystemSettingSeeder::class,
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currencies = [

            [
                'name' => 'US Dollar',
                'code' => 'USD',
                'symbol' => '$',
                'exchange_rate' => 1,
                'is_base' => true,
                'is_active' => true,
            ],

            [
                'name' => 'Nigerian Naira',
                'code' => 'NGN',
                'symbol' => '₦',
                'exchange_rate' => 1550,
                'is_base' => false,
                'is_active' => true,
            ],

            [
                'name' => 'British Pound',
                'code' => 'GBP',
                'symbol' => '£',
                'exchange_rate' => 0.74,
                'is_base' => false,
                'is_active' => true,
            ],

            [
                'name' => 'Euro',
                'code' => 'EUR',
                'symbol' => '€',
                'exchange_rate' => 0.86,
                'is_base' => false,
                'is_active' => true,
            ],

            [
                'name' => 'Ghana Cedi',
                'code' => 'GHS',
                'symbol' => 'GH₵',
                'exchange_rate' => 10.4,
                'is_base' => false,
                'is_active' => true,
            ],

            [
                'name' => 'Kenyan Shilling',
                'code' => 'KES',
                'symbol' => 'KSh',
                'exchange_rate' => 129,
                'is_base' => false,
                'is_active' => true,
            ],

            [
                'name' => 'South African Rand',
                'code' => 'ZAR',
                'symbol' => 'R',
                'exchange_rate' => 18,
                'is_base' => false,
                'is_active' => true,
            ],

            [
                'name' => 'Canadian Dollar',
                'code' => 'CAD',
                'symbol' => 'C$',
                'exchange_rate' => 1.37,
                'is_base' => false,
                'is_active' => true,
            ],

            [
                'name' => 'Australian Dollar',
                'code' => 'AUD',
                'symbol' => 'A$',
                'exchange_rate' => 1.52,
                'is_base' => false,
                'is_active' => true,
            ],

            [
                'name' => 'Indian Rupee',
                'code' => 'INR',
                'symbol' => '₹',
                'exchange_rate' => 86,
                'is_base' => false,
                'is_active' => true,
            ],
        ];

        foreach ($currencies as $currency) {

            Currency::updateOrCreate(

                ['code' => $currency['code']],

                $currency
            );
        }
    }
}

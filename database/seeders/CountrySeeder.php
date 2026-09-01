<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Currency;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $countries = [

            [
                'name' => 'Nigeria',
                'iso2' => 'NG',
                'iso3' => 'NGA',
                'phone_code' => '+234',
                'timezone' => 'Africa/Lagos',
                'locale' => 'en',
                'currency' => 'NGN',
            ],

            [
                'name' => 'Ghana',
                'iso2' => 'GH',
                'iso3' => 'GHA',
                'phone_code' => '+233',
                'timezone' => 'Africa/Accra',
                'locale' => 'en',
                'currency' => 'GHS',
            ],

            [
                'name' => 'Kenya',
                'iso2' => 'KE',
                'iso3' => 'KEN',
                'phone_code' => '+254',
                'timezone' => 'Africa/Nairobi',
                'locale' => 'en',
                'currency' => 'KES',
            ],

            [
                'name' => 'South Africa',
                'iso2' => 'ZA',
                'iso3' => 'ZAF',
                'phone_code' => '+27',
                'timezone' => 'Africa/Johannesburg',
                'locale' => 'en',
                'currency' => 'ZAR',
            ],

            [
                'name' => 'United Kingdom',
                'iso2' => 'GB',
                'iso3' => 'GBR',
                'phone_code' => '+44',
                'timezone' => 'Europe/London',
                'locale' => 'en',
                'currency' => 'GBP',
            ],

            [
                'name' => 'United States',
                'iso2' => 'US',
                'iso3' => 'USA',
                'phone_code' => '+1',
                'timezone' => 'America/New_York',
                'locale' => 'en',
                'currency' => 'USD',
            ],

            [
                'name' => 'Canada',
                'iso2' => 'CA',
                'iso3' => 'CAN',
                'phone_code' => '+1',
                'timezone' => 'America/Toronto',
                'locale' => 'en',
                'currency' => 'CAD',
            ],

            [
                'name' => 'Australia',
                'iso2' => 'AU',
                'iso3' => 'AUS',
                'phone_code' => '+61',
                'timezone' => 'Australia/Sydney',
                'locale' => 'en',
                'currency' => 'AUD',
            ],

            [
                'name' => 'India',
                'iso2' => 'IN',
                'iso3' => 'IND',
                'phone_code' => '+91',
                'timezone' => 'Asia/Kolkata',
                'locale' => 'en',
                'currency' => 'INR',
            ],

            [
                'name' => 'Germany',
                'iso2' => 'DE',
                'iso3' => 'DEU',
                'phone_code' => '+49',
                'timezone' => 'Europe/Berlin',
                'locale' => 'de',
                'currency' => 'EUR',
            ],

        ];

        foreach ($countries as $country) {

            $currency = Currency::where(
                'code',
                $country['currency']
            )->first();

            if (!$currency) {
                continue;
            }

            Country::updateOrCreate(

                [
                    'iso2' => $country['iso2']
                ],

                [
                    'name' => $country['name'],
                    'iso3' => $country['iso3'],
                    'phone_code' => $country['phone_code'],
                    'timezone' => $country['timezone'],
                    'locale' => $country['locale'],
                    'currency_id' => $currency->id,
                    'is_active' => true,
                ]
            );
        }
    }
}

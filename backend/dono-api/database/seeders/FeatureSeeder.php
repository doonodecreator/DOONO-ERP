<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Feature;

class FeatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $features = [

            /*
            |--------------------------------------------------------------------------
            | Student Management
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Students',
                'slug' => 'students',
                'category' => 'Student Management',
            ],

            [
                'name' => 'Attendance',
                'slug' => 'attendance',
                'category' => 'Student Management',
            ],

            [
                'name' => 'Results',
                'slug' => 'results',
                'category' => 'Student Management',
            ],

            [
                'name' => 'Report Cards',
                'slug' => 'report_cards',
                'category' => 'Student Management',
            ],

            /*
            |--------------------------------------------------------------------------
            | Finance
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Fees',
                'slug' => 'fees',
                'category' => 'Finance',
            ],

            /*
            |--------------------------------------------------------------------------
            | Learning
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'CBT',
                'slug' => 'cbt',
                'category' => 'Learning',
            ],

            [
                'name' => 'Library',
                'slug' => 'library',
                'category' => 'Learning',
            ],

            /*
            |--------------------------------------------------------------------------
            | Transport
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Transport',
                'slug' => 'transport',
                'category' => 'Transport',
            ],

            /*
            |--------------------------------------------------------------------------
            | Communication
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'SMS',
                'slug' => 'sms',
                'category' => 'Communication',
            ],

            /*
            |--------------------------------------------------------------------------
            | Premium Features
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Hostel',
                'slug' => 'hostel',
                'category' => 'Premium',
            ],

            [
                'name' => 'Payroll',
                'slug' => 'payroll',
                'category' => 'Premium',
            ],

            [
                'name' => 'Inventory',
                'slug' => 'inventory',
                'category' => 'Premium',
            ],

            [
                'name' => 'Accounting',
                'slug' => 'accounting',
                'category' => 'Premium',
            ],

            [
                'name' => 'AI Reports',
                'slug' => 'ai_reports',
                'category' => 'Premium',
            ],
        ];

        foreach ($features as $feature) {

            Feature::updateOrCreate(

                [
                    'slug' => $feature['slug'],
                ],

                [
                    'name' => $feature['name'],
                    'category' => $feature['category'],
                    'description' => null,
                    'is_active' => true,
                ]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class AdditionalRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [

            [
                'name' => 'Registrar',
                'slug' => 'registrar',
                'description' => 'Admissions and Student Records',
            ],

            [
                'name' => 'Accountant',
                'slug' => 'accountant',
                'description' => 'School Accountant',
            ],

            [
                'name' => 'Receptionist',
                'slug' => 'receptionist',
                'description' => 'Front Desk Officer',
            ],

            [
                'name' => 'Librarian',
                'slug' => 'librarian',
                'description' => 'Library Management',
            ],

            [
                'name' => 'School Nurse',
                'slug' => 'school_nurse',
                'description' => 'School Clinic',
            ],

            [
                'name' => 'Hostel Master',
                'slug' => 'hostel_master',
                'description' => 'Male Hostel Supervisor',
            ],

            [
                'name' => 'Hostel Mistress',
                'slug' => 'hostel_mistress',
                'description' => 'Female Hostel Supervisor',
            ],

            [
                'name' => 'Transport Officer',
                'slug' => 'transport_officer',
                'description' => 'School Transport',
            ],

            [
                'name' => 'Store Keeper',
                'slug' => 'store_keeper',
                'description' => 'Inventory Officer',
            ],

            [
                'name' => 'ICT Administrator',
                'slug' => 'ict_administrator',
                'description' => 'ICT Department',
            ],

            [
                'name' => 'Guidance Counselor',
                'slug' => 'guidance_counselor',
                'description' => 'Student Counseling',
            ],

            [
                'name' => 'Security Officer',
                'slug' => 'security_officer',
                'description' => 'School Security',
            ],

        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['slug' => $role['slug']],
                $role
            );
        }
    }
}

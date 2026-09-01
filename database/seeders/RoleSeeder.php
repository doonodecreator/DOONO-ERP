<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [

            [
                'name' => 'Super Admin',
                'slug' => 'super_admin',
                'description' => 'DOONO System Owner',
            ],

            [
                'name' => 'Proprietor',
                'slug' => 'proprietor',
                'description' => 'School Owner',
            ],

            [
                'name' => 'Principal',
                'slug' => 'principal',
                'description' => 'Principal',
            ],

            [
                'name' => 'Vice Principal',
                'slug' => 'vice_principal',
                'description' => 'Vice Principal',
            ],

            [
                'name' => 'Head Teacher',
                'slug' => 'head_teacher',
                'description' => 'Head Teacher',
            ],

            [
                'name' => 'Bursar',
                'slug' => 'bursar',
                'description' => 'Finance Officer',
            ],

            [
                'name' => 'Teacher',
                'slug' => 'teacher',
                'description' => 'Teacher',
            ],

            [
                'name' => 'Parent',
                'slug' => 'parent',
                'description' => 'Parent',
            ],

            [
                'name' => 'Student',
                'slug' => 'student',
                'description' => 'Student',
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

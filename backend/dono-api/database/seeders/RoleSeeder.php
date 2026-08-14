<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super_admin', 'description' => 'DONO Software Owner'],
            ['name' => 'Proprietor', 'slug' => 'proprietor', 'description' => 'School Owner'],
            ['name' => 'Principal', 'slug' => 'principal', 'description' => 'School Principal / Headmaster'],
            ['name' => 'Vice Principal Academic', 'slug' => 'vice_principal_academic', 'description' => 'Academic leadership'],
            ['name' => 'Vice Principal Administration', 'slug' => 'vice_principal_admin', 'description' => 'Administrative leadership'],
            ['name' => 'Nursery Head', 'slug' => 'nursery_head', 'description' => 'Nursery leadership'],
            ['name' => 'Primary Headmaster', 'slug' => 'primary_headmaster', 'description' => 'Primary school leadership'],
            ['name' => 'Secondary Principal', 'slug' => 'secondary_principal', 'description' => 'Secondary school leadership'],
            ['name' => 'Teacher', 'slug' => 'teacher', 'description' => 'Teacher'],
            ['name' => 'Form Teacher', 'slug' => 'form_teacher', 'description' => 'Class pastoral and academic lead'],
            ['name' => 'Bursar', 'slug' => 'bursar', 'description' => 'Cashier / Bursar'],
            ['name' => 'Parent', 'slug' => 'parent', 'description' => 'Parent portal user'],
            ['name' => 'Student', 'slug' => 'student', 'description' => 'Student portal user'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }
    }
}

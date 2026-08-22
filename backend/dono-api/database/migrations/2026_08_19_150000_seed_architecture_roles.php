<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
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
            ['name' => 'Organization Owner', 'slug' => 'organization_owner', 'description' => 'Organization owner'],
            ['name' => 'Teacher', 'slug' => 'teacher', 'description' => 'Teacher'],
            ['name' => 'Form Teacher', 'slug' => 'form_teacher', 'description' => 'Class pastoral and academic lead'],
            ['name' => 'Bursar', 'slug' => 'bursar', 'description' => 'School cashier / bursar'],
            ['name' => 'Accountant', 'slug' => 'accountant', 'description' => 'School accountant'],
            ['name' => 'Librarian', 'slug' => 'librarian', 'description' => 'School librarian'],
            ['name' => 'Nurse', 'slug' => 'nurse', 'description' => 'School nurse'],
            ['name' => 'Hostel Master', 'slug' => 'hostel_master', 'description' => 'Hostel master'],
            ['name' => 'Hostel Mistress', 'slug' => 'hostel_mistress', 'description' => 'Hostel mistress'],
            ['name' => 'Transport Manager', 'slug' => 'transport_manager', 'description' => 'Transport manager'],
            ['name' => 'Receptionist', 'slug' => 'receptionist', 'description' => 'Receptionist'],
            ['name' => 'Registrar', 'slug' => 'registrar', 'description' => 'Admissions registrar'],
            ['name' => 'Guidance Counselor', 'slug' => 'guidance_counselor', 'description' => 'Guidance counselor'],
            ['name' => 'Store Keeper', 'slug' => 'store_keeper', 'description' => 'Store and inventory keeper'],
            ['name' => 'ICT Administrator', 'slug' => 'ict_administrator', 'description' => 'ICT administrator'],
            ['name' => 'Security Officer', 'slug' => 'security_officer', 'description' => 'Security officer'],
            ['name' => 'Parent', 'slug' => 'parent', 'description' => 'Parent portal user'],
            ['name' => 'Student', 'slug' => 'student', 'description' => 'Student portal user'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $role['slug']],
                [...$role, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    public function down(): void
    {
        // Role records are shared configuration and are intentionally not deleted.
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['name' => 'Send Communication', 'slug' => 'send_communication'],
            ['name' => 'View Communication', 'slug' => 'view_communication'],
            ['name' => 'Manage CBT Questions', 'slug' => 'manage_cbt_questions'],
            ['name' => 'View CBT Questions', 'slug' => 'view_cbt_questions'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(['slug' => $permission['slug']], [...$permission, 'updated_at' => now(), 'created_at' => now()]);
        }

        $permissionIds = DB::table('permissions')->whereIn('slug', array_column($permissions, 'slug'))->pluck('id', 'slug');
        $roleGrants = [
            'proprietor' => ['send_communication', 'view_communication', 'manage_cbt_questions', 'view_cbt_questions'],
            'principal' => ['send_communication', 'view_communication', 'manage_cbt_questions', 'view_cbt_questions'],
            'vice_principal_academic' => ['view_communication', 'manage_cbt_questions', 'view_cbt_questions'],
            'vice_principal_admin' => ['view_communication'],
            'teacher' => ['view_communication', 'view_cbt_questions', 'manage_cbt_questions'],
            'form_teacher' => ['send_communication', 'view_communication', 'view_cbt_questions'],
            'nursery_head' => ['send_communication', 'view_communication', 'view_cbt_questions'],
            'primary_headmaster' => ['send_communication', 'view_communication', 'manage_cbt_questions', 'view_cbt_questions'],
            'secondary_principal' => ['send_communication', 'view_communication', 'manage_cbt_questions', 'view_cbt_questions'],
            'receptionist' => ['view_communication'],
            'parent' => ['view_communication'],
            'student' => ['view_communication', 'view_cbt_questions'],
        ];

        foreach ($roleGrants as $roleSlug => $permissionSlugs) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if (!$roleId) {
                continue;
            }

            foreach ($permissionSlugs as $permissionSlug) {
                $permissionId = $permissionIds[$permissionSlug] ?? null;
                if (!$permissionId) {
                    continue;
                }
                DB::table('role_permission')->updateOrInsert([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                ], ['created_at' => now(), 'updated_at' => now()]);
            }
        }
    }

    public function down(): void
    {
        $slugs = ['manage_cbt_questions', 'view_cbt_questions'];
        $ids = DB::table('permissions')->whereIn('slug', $slugs)->pluck('id');
        DB::table('role_permission')->whereIn('permission_id', $ids)->delete();
        DB::table('permissions')->whereIn('slug', $slugs)->delete();
    }
};

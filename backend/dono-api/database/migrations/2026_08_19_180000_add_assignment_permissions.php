<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('roles') || !Schema::hasTable('permissions') || !Schema::hasTable('role_permission')) return;

        foreach ([
            ['name' => 'View Assignments', 'slug' => 'view_assignments'],
            ['name' => 'Manage Assignments', 'slug' => 'manage_assignments'],
        ] as $permission) {
            DB::table('permissions')->updateOrInsert(['slug' => $permission['slug']], [...$permission, 'created_at' => now(), 'updated_at' => now()]);
        }

        $roleIds = DB::table('roles')->whereIn('slug', ['teacher', 'form_teacher'])->pluck('id');
        $permissionIds = DB::table('permissions')->whereIn('slug', ['view_assignments', 'manage_assignments'])->pluck('id');
        foreach ($roleIds as $roleId) {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permission')->updateOrInsert(
                    ['role_id' => $roleId, 'permission_id' => $permissionId],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }

    public function down(): void
    {
        // Shared permissions are intentionally retained on rollback.
    }
};

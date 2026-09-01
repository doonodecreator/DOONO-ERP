<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('roles') || ! Schema::hasTable('permissions') || ! Schema::hasTable('role_permission')) {
            return;
        }

        DB::transaction(function (): void {
            foreach ([
                ['name' => 'Use Student Exchange', 'slug' => 'use_exchange'],
                ['name' => 'Manage Student Exchange', 'slug' => 'manage_exchange'],
            ] as $permission) {
                DB::table('permissions')->updateOrInsert(
                    ['slug' => $permission['slug']],
                    ['name' => $permission['name'], 'created_at' => now(), 'updated_at' => now()]
                );
            }

            $permissionIds = DB::table('permissions')->whereIn('slug', ['use_exchange', 'manage_exchange'])->pluck('id', 'slug');
            $studentRole = DB::table('roles')->where('slug', 'student')->value('id');
            if ($studentRole && isset($permissionIds['use_exchange'])) {
                DB::table('role_permission')->updateOrInsert(['role_id' => $studentRole, 'permission_id' => $permissionIds['use_exchange']], ['created_at' => now(), 'updated_at' => now()]);
            }

            foreach (['proprietor', 'principal', 'vice_principal_academic', 'vice_principal_admin', 'nursery_head', 'primary_headmaster', 'secondary_principal', 'teacher', 'form_teacher'] as $slug) {
                $roleId = DB::table('roles')->where('slug', $slug)->value('id');
                if ($roleId && isset($permissionIds['manage_exchange'])) {
                    DB::table('role_permission')->updateOrInsert(['role_id' => $roleId, 'permission_id' => $permissionIds['manage_exchange']], ['created_at' => now(), 'updated_at' => now()]);
                }
            }
        });
    }

    public function down(): void
    {
        // Shared permissions are intentionally retained on rollback.
    }
};

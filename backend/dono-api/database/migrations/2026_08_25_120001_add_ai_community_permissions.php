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
                ['name' => 'Use AI Tutor', 'slug' => 'use_ai_tutor'],
                ['name' => 'Manage Student Community', 'slug' => 'manage_community'],
            ] as $permission) {
                DB::table('permissions')->updateOrInsert(
                    ['slug' => $permission['slug']],
                    ['name' => $permission['name'], 'created_at' => now(), 'updated_at' => now()]
                );
            }

            $aiRoleSlugs = [
                'student', 'teacher', 'form_teacher', 'proprietor', 'principal',
                'vice_principal_academic', 'vice_principal_admin', 'nursery_head',
                'primary_headmaster', 'secondary_principal',
            ];
            $moderatorRoleSlugs = [
                'proprietor', 'principal', 'vice_principal_academic', 'vice_principal_admin',
                'nursery_head', 'primary_headmaster', 'secondary_principal',
            ];
            $permissionIds = DB::table('permissions')->whereIn('slug', ['use_ai_tutor', 'manage_community'])->pluck('id', 'slug');

            foreach ($aiRoleSlugs as $slug) {
                $roleId = DB::table('roles')->where('slug', $slug)->value('id');
                if ($roleId && isset($permissionIds['use_ai_tutor'])) {
                    DB::table('role_permission')->updateOrInsert(
                        ['role_id' => $roleId, 'permission_id' => $permissionIds['use_ai_tutor']],
                        ['created_at' => now(), 'updated_at' => now()]
                    );
                }
            }

            foreach ($moderatorRoleSlugs as $slug) {
                $roleId = DB::table('roles')->where('slug', $slug)->value('id');
                if ($roleId && isset($permissionIds['manage_community'])) {
                    DB::table('role_permission')->updateOrInsert(
                        ['role_id' => $roleId, 'permission_id' => $permissionIds['manage_community']],
                        ['created_at' => now(), 'updated_at' => now()]
                    );
                }
            }
        });
    }

    public function down(): void
    {
        // Shared permissions are intentionally retained on rollback.
    }
};

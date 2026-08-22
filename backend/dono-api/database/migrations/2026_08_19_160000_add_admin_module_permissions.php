<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('roles') || !Schema::hasTable('permissions') || !Schema::hasTable('role_permission')) {
            return;
        }

        DB::transaction(function (): void {
            foreach ([
                ['name' => 'Manage Events', 'slug' => 'manage_events'],
                ['name' => 'Manage Facilities', 'slug' => 'manage_facilities'],
            ] as $permission) {
                DB::table('permissions')->updateOrInsert(
                    ['slug' => $permission['slug']],
                    [...$permission, 'created_at' => now(), 'updated_at' => now()]
                );
            }

            $roleId = DB::table('roles')->where('slug', 'vice_principal_admin')->value('id');
            if (!$roleId) return;

            $permissionIds = DB::table('permissions')
                ->whereIn('slug', ['manage_events', 'manage_facilities'])
                ->pluck('id');

            $rows = $permissionIds->map(fn ($permissionId) => [
                'role_id' => $roleId,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ])->all();

            foreach ($rows as $row) {
                DB::table('role_permission')->updateOrInsert(
                    ['role_id' => $row['role_id'], 'permission_id' => $row['permission_id']],
                    ['created_at' => $row['created_at'], 'updated_at' => $row['updated_at']]
                );
            }
        });
    }

    public function down(): void
    {
        // Shared permissions are intentionally retained on rollback.
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissionId = DB::table('permissions')->where('slug', 'view_communication')->value('id');

        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'View Communication',
                'slug' => 'view_communication',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $roleIds = DB::table('roles')
            ->where('slug', '!=', 'super_admin')
            ->pluck('id');

        foreach ($roleIds as $roleId) {
            DB::table('role_permission')->insertOrIgnore([
                'role_id' => $roleId,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Communication visibility is intentionally retained on rollback. The
        // canonical role permission configuration remains the explicit source
        // of truth for any deliberate permission removal.
    }
};

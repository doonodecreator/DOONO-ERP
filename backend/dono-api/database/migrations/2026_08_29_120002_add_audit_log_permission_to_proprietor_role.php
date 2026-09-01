<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roleId = DB::table('roles')->where('slug', 'proprietor')->value('id');
        $permissionId = DB::table('permissions')->where('slug', 'view_audit_logs')->value('id');

        if (! $roleId || ! $permissionId) {
            return;
        }

        DB::table('role_permission')->updateOrInsert(
            [
                'role_id' => $roleId,
                'permission_id' => $permissionId,
            ],
            [
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        $roleId = DB::table('roles')->where('slug', 'proprietor')->value('id');
        $permissionId = DB::table('permissions')->where('slug', 'view_audit_logs')->value('id');

        if (! $roleId || ! $permissionId) {
            return;
        }

        DB::table('role_permission')
            ->where('role_id', $roleId)
            ->where('permission_id', $permissionId)
            ->delete();
    }
};

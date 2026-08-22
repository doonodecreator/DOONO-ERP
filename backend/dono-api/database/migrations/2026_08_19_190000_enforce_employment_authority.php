<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('roles') || !Schema::hasTable('permissions') || !Schema::hasTable('role_permission')) return;

        DB::table('permissions')->updateOrInsert(
            ['slug' => 'view_staff'],
            ['name' => 'View Staff', 'created_at' => now(), 'updated_at' => now()]
        );

        $viewStaffId = DB::table('permissions')->where('slug', 'view_staff')->value('id');
        $readRoles = DB::table('roles')->whereIn('slug', [
            'proprietor', 'principal', 'vice_principal_academic', 'vice_principal_admin',
            'nursery_head', 'primary_headmaster', 'secondary_principal',
        ])->pluck('id');

        foreach ($readRoles as $roleId) {
            DB::table('role_permission')->updateOrInsert(
                ['role_id' => $roleId, 'permission_id' => $viewStaffId],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }

        $principalId = DB::table('roles')->where('slug', 'principal')->value('id');
        $assignRolesId = DB::table('permissions')->where('slug', 'assign_roles')->value('id');
        if ($principalId && $assignRolesId) {
            DB::table('role_permission')->where('role_id', $principalId)->where('permission_id', $assignRolesId)->delete();
        }
    }

    public function down(): void
    {
        // Do not restore the insecure Principal invitation permission.
    }
};

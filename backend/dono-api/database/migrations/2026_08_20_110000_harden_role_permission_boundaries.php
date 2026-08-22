<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roleIds = DB::table('roles')
            ->whereIn('slug', [
                'principal',
                'vice_principal_admin',
                'nursery_head',
                'primary_headmaster',
                'secondary_principal',
            ])
            ->pluck('id');

        $manageStaffPermissionId = DB::table('permissions')
            ->where('slug', 'manage_staff')
            ->value('id');

        if ($manageStaffPermissionId && $roleIds->isNotEmpty()) {
            DB::table('role_permission')
                ->whereIn('role_id', $roleIds)
                ->where('permission_id', $manageStaffPermissionId)
                ->delete();
        }

        $restrictedRoleIds = DB::table('roles')
            ->whereIn('slug', ['parent', 'accountant'])
            ->pluck('id');

        $receivePaymentsPermissionId = DB::table('permissions')
            ->where('slug', 'receive_payments')
            ->value('id');

        if ($receivePaymentsPermissionId && $restrictedRoleIds->isNotEmpty()) {
            DB::table('role_permission')
                ->whereIn('role_id', $restrictedRoleIds)
                ->where('permission_id', $receivePaymentsPermissionId)
                ->delete();
        }
    }

    public function down(): void
    {
        // Permission hardening is intentionally not reversed automatically.
        // Re-granting these capabilities could expose staff employment or payment
        // operations after a rollback; the canonical RolePermissionSeeder remains
        // the explicit source of truth for any deliberate restoration.
    }
};

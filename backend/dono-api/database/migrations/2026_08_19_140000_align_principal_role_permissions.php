<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Align the existing Principal role with the approved DONO architecture.
     * Principals may view finance reports but must not invite staff, configure fees,
     * assign student fees, receive payments, or manage payroll/budgets.
     */
    public function up(): void
    {
        if (! Schema::hasTable('roles')
            || ! Schema::hasTable('permissions')
            || ! Schema::hasTable('role_permission')) {
            return;
        }

        DB::transaction(function (): void {
            DB::table('permissions')->updateOrInsert(
                ['slug' => 'view_finance_reports'],
                [
                    'name' => 'View Finance Reports',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $roleId = DB::table('roles')->where('slug', 'principal')->value('id');

            if (! $roleId) {
                return;
            }

            $permissionSlugs = [
                'view_dashboard',
                'manage_staff',
                'view_staff',
                'manage_students',
                'view_students',
                'view_results',
                'manage_promotions',
                'view_timetable',
                'approve_admissions',
                'approve_results',
                'approve_promotions',
                'approve_timetable',
                'send_communication',
                'view_communication',
                'view_finance_reports',
            ];

            $permissionIds = DB::table('permissions')
                ->whereIn('slug', $permissionSlugs)
                ->pluck('id')
                ->all();

            DB::table('role_permission')->where('role_id', $roleId)->delete();

            $now = now();
            $rows = array_map(
                fn (int $permissionId): array => [
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                $permissionIds
            );

            if ($rows !== []) {
                DB::table('role_permission')->insert($rows);
            }
        });
    }

    public function down(): void
    {
        // Do not restore stale permissions automatically.
    }
};

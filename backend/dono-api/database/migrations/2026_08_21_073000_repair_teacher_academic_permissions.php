<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['name' => 'View Students', 'slug' => 'view_students'],
            ['name' => 'Manage Attendance', 'slug' => 'manage_attendance'],
            ['name' => 'Manage Assessments', 'slug' => 'manage_assessments'],
            ['name' => 'Manage Exam Scores', 'slug' => 'manage_exam_scores'],
            ['name' => 'View Results', 'slug' => 'view_results'],
            ['name' => 'View Timetable', 'slug' => 'view_timetable'],
            ['name' => 'View Assignments', 'slug' => 'view_assignments'],
            ['name' => 'Manage Assignments', 'slug' => 'manage_assignments'],
            ['name' => 'View Communication', 'slug' => 'view_communication'],
            ['name' => 'Send Communication', 'slug' => 'send_communication'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                ['name' => $permission['name'], 'updated_at' => now(), 'created_at' => now()],
            );
        }

        $permissionIds = DB::table('permissions')
            ->whereIn('slug', array_column($permissions, 'slug'))
            ->pluck('id');
        $roleIds = DB::table('roles')
            ->whereIn('slug', ['teacher', 'form_teacher'])
            ->pluck('id');

        $now = now();
        foreach ($roleIds as $roleId) {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permission')->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        // Permission grants are retained on rollback to avoid removing access from
        // existing teacher workflows without an explicit RBAC decision.
    }
};

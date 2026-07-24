<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [

            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'view_dashboard'],

            // Organization
            ['name' => 'Manage Organizations', 'slug' => 'manage_organizations'],

            // Schools
            ['name' => 'Manage Schools', 'slug' => 'manage_schools'],

            // Academic
            ['name' => 'Manage Academic Sessions', 'slug' => 'manage_academic_sessions'],
            ['name' => 'Manage Terms', 'slug' => 'manage_terms'],
            ['name' => 'Manage Classes', 'slug' => 'manage_classes'],
            ['name' => 'Manage Streams', 'slug' => 'manage_streams'],
            ['name' => 'Manage Subjects', 'slug' => 'manage_subjects'],

            // Students
            ['name' => 'Manage Students', 'slug' => 'manage_students'],
            ['name' => 'View Students', 'slug' => 'view_students'],

            // Staff
            ['name' => 'Manage Staff', 'slug' => 'manage_staff'],

            // Parents
            ['name' => 'Manage Parents', 'slug' => 'manage_parents'],

            // Attendance
            ['name' => 'Manage Attendance', 'slug' => 'manage_attendance'],

            // Exams
            ['name' => 'Manage Examinations', 'slug' => 'manage_examinations'],
            ['name' => 'Manage Exam Scores', 'slug' => 'manage_exam_scores'],

            // Fees
            ['name' => 'Manage Fee Categories', 'slug' => 'manage_fee_categories'],
            ['name' => 'Manage Student Fees', 'slug' => 'manage_student_fees'],
            ['name' => 'Receive Payments', 'slug' => 'receive_payments'],
            ['name' => 'View Revenue', 'slug' => 'view_revenue'],

            // Users
            ['name' => 'Manage Users', 'slug' => 'manage_users'],
            ['name' => 'Assign Roles', 'slug' => 'assign_roles'],

        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }
    }
}

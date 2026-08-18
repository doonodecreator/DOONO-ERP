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
            ['name' => 'Manage Divisions', 'slug' => 'manage_divisions'],
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

            // --- Added to complete the full role-based architecture ---

            // Platform / system
            ['name' => 'Manage System Settings', 'slug' => 'manage_system_settings'],
            ['name' => 'Manage Subscriptions', 'slug' => 'manage_subscriptions'],
            ['name' => 'View Audit Logs', 'slug' => 'view_audit_logs'],

            // Academic (results, promotion, timetable)
            ['name' => 'Manage Assessments', 'slug' => 'manage_assessments'],
            ['name' => 'Manage Results', 'slug' => 'manage_results'],
            ['name' => 'View Results', 'slug' => 'view_results'],
            ['name' => 'Manage Promotions', 'slug' => 'manage_promotions'],
            ['name' => 'Manage Report Cards', 'slug' => 'manage_report_cards'],
            ['name' => 'Manage Timetable', 'slug' => 'manage_timetable'],
            ['name' => 'View Timetable', 'slug' => 'view_timetable'],

            // Approvals
            ['name' => 'Approve Admissions', 'slug' => 'approve_admissions'],
            ['name' => 'Approve Results', 'slug' => 'approve_results'],
            ['name' => 'Approve Promotions', 'slug' => 'approve_promotions'],
            ['name' => 'Approve Timetable', 'slug' => 'approve_timetable'],

            // Finance
            ['name' => 'Manage Payroll', 'slug' => 'manage_payroll'],
            ['name' => 'Manage Budget', 'slug' => 'manage_budget'],
            ['name' => 'View Finance Reports', 'slug' => 'view_finance_reports'],

            // Communication
            ['name' => 'Send Communication', 'slug' => 'send_communication'],
            ['name' => 'View Communication', 'slug' => 'view_communication'],

            // Facilities & support services
            ['name' => 'Manage Library', 'slug' => 'manage_library'],
            ['name' => 'Manage Hostel', 'slug' => 'manage_hostel'],
            ['name' => 'Manage Transport', 'slug' => 'manage_transport'],
            ['name' => 'Manage Clinic', 'slug' => 'manage_clinic'],
            ['name' => 'Manage Inventory', 'slug' => 'manage_inventory'],
            ['name' => 'Manage Discipline', 'slug' => 'manage_discipline'],
            ['name' => 'Manage Front Desk', 'slug' => 'manage_front_desk'],

            // Portals
            ['name' => 'Parent Portal Access', 'slug' => 'portal_parent_access'],
            ['name' => 'Student Portal Access', 'slug' => 'portal_student_access'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }
    }
}

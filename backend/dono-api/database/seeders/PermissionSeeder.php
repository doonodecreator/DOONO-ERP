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
            ['name' => 'View School Insights', 'slug' => 'view_insights'],

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
            ['name' => 'Issue Student ID Cards', 'slug' => 'issue_student_id_cards'],

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
            ['name' => 'View Staff', 'slug' => 'view_staff'],
            ['name' => 'Assign Roles', 'slug' => 'assign_roles'],

            // --- Added to complete the full role-based architecture ---

            // Platform / system
            ['name' => 'Manage System Settings', 'slug' => 'manage_system_settings'],
            ['name' => 'Manage School API Keys', 'slug' => 'manage_api_keys'],
            ['name' => 'Manage OAuth Clients', 'slug' => 'manage_oauth_clients'],
            ['name' => 'Manage Marketplace', 'slug' => 'manage_marketplace'],
            ['name' => 'Manage Benchmarking Consent', 'slug' => 'manage_benchmarking'],
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
            ['name' => 'View Health Records', 'slug' => 'view_health_records'],
            ['name' => 'View Sensitive Health Records', 'slug' => 'view_sensitive_health'],
            ['name' => 'Manage Inventory', 'slug' => 'manage_inventory'],
            ['name' => 'Manage Discipline', 'slug' => 'manage_discipline'],
            ['name' => 'Manage Front Desk', 'slug' => 'manage_front_desk'],
            ['name' => 'Manage Events', 'slug' => 'manage_events'],
            ['name' => 'Manage Facilities', 'slug' => 'manage_facilities'],
            ['name' => 'View Assignments', 'slug' => 'view_assignments'],
            ['name' => 'Manage Assignments', 'slug' => 'manage_assignments'],
            ['name' => 'Manage CBT Questions', 'slug' => 'manage_cbt_questions'],
            ['name' => 'View CBT Questions', 'slug' => 'view_cbt_questions'],

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

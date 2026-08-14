<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $map = [
            'super_admin' => ['manage_organizations', 'manage_schools', 'manage_subscriptions', 'manage_system_settings', 'view_audit_logs'],
            'proprietor' => ['view_dashboard', 'manage_schools', 'manage_staff', 'assign_roles', 'manage_academic_sessions', 'manage_terms', 'manage_classes', 'manage_streams', 'manage_subjects', 'manage_students', 'view_students', 'manage_parents', 'manage_attendance', 'manage_examinations', 'manage_exam_scores', 'manage_assessments', 'manage_results', 'view_results', 'manage_promotions', 'manage_report_cards', 'manage_timetable', 'view_timetable', 'approve_admissions', 'approve_results', 'approve_promotions', 'approve_timetable', 'manage_fee_categories', 'manage_student_fees', 'receive_payments', 'view_revenue', 'manage_payroll', 'manage_budget', 'view_finance_reports', 'send_communication', 'view_communication', 'manage_library', 'manage_hostel', 'manage_transport', 'manage_clinic', 'manage_inventory', 'manage_discipline', 'manage_front_desk'],
            'principal' => ['view_dashboard', 'manage_staff', 'manage_academic_sessions', 'manage_terms', 'manage_classes', 'manage_streams', 'manage_subjects', 'manage_students', 'view_students', 'manage_attendance', 'manage_examinations', 'manage_exam_scores', 'manage_results', 'view_results', 'manage_promotions', 'manage_report_cards', 'manage_timetable', 'view_timetable', 'approve_admissions', 'approve_results', 'approve_promotions', 'approve_timetable', 'send_communication', 'view_communication', 'manage_discipline'],
            'vice_principal_academic' => ['view_dashboard', 'view_students', 'manage_classes', 'manage_subjects', 'manage_attendance', 'manage_examinations', 'manage_assessments', 'manage_results', 'view_results', 'manage_promotions', 'manage_report_cards', 'view_timetable', 'view_communication'],
            'vice_principal_admin' => ['view_dashboard', 'manage_staff', 'view_students', 'manage_attendance', 'manage_discipline', 'manage_inventory', 'manage_front_desk', 'view_communication'],
            'nursery_head' => ['view_dashboard', 'manage_staff', 'manage_classes', 'manage_students', 'view_students', 'manage_attendance', 'manage_assessments', 'manage_results', 'view_results', 'manage_timetable', 'view_timetable', 'send_communication', 'view_communication'],
            'primary_headmaster' => ['view_dashboard', 'manage_staff', 'manage_classes', 'manage_subjects', 'manage_students', 'view_students', 'manage_attendance', 'manage_assessments', 'manage_examinations', 'manage_results', 'view_results', 'manage_promotions', 'manage_timetable', 'view_timetable', 'send_communication', 'view_communication'],
            'secondary_principal' => ['view_dashboard', 'manage_staff', 'manage_classes', 'manage_subjects', 'manage_students', 'view_students', 'manage_attendance', 'manage_assessments', 'manage_examinations', 'manage_exam_scores', 'manage_results', 'view_results', 'manage_promotions', 'manage_timetable', 'view_timetable', 'send_communication', 'view_communication'],
            'teacher' => ['view_dashboard', 'view_students', 'manage_attendance', 'manage_assessments', 'manage_exam_scores', 'view_results', 'view_timetable', 'view_communication'],
            'form_teacher' => ['view_dashboard', 'view_students', 'manage_attendance', 'manage_assessments', 'manage_exam_scores', 'view_results', 'view_timetable', 'send_communication', 'view_communication'],
            'bursar' => ['view_dashboard', 'manage_fee_categories', 'manage_student_fees', 'receive_payments', 'view_revenue', 'manage_payroll', 'manage_budget', 'view_finance_reports'],
            'accountant' => ['view_dashboard', 'receive_payments', 'view_revenue', 'manage_payroll', 'manage_budget', 'view_finance_reports'],
            'librarian' => ['view_dashboard', 'manage_library'],
            'nurse' => ['view_dashboard', 'manage_clinic', 'view_students'],
            'hostel_master' => ['view_dashboard', 'manage_hostel'],
            'hostel_mistress' => ['view_dashboard', 'manage_hostel'],
            'transport_manager' => ['view_dashboard', 'manage_transport'],
            'receptionist' => ['view_dashboard', 'manage_front_desk', 'view_communication'],
            'store_keeper' => ['view_dashboard', 'manage_inventory'],
            'registrar' => ['view_dashboard', 'view_students', 'manage_students', 'approve_admissions'],
            'ict_administrator' => ['view_dashboard', 'manage_system_settings', 'view_communication'],
            'guidance_counselor' => ['view_dashboard', 'manage_discipline', 'view_students'],
            'security_officer' => ['view_dashboard', 'manage_front_desk'],
            'parent' => ['portal_parent_access', 'view_communication', 'receive_payments'],
            'student' => ['portal_student_access'],
        ];

        foreach ($map as $roleSlug => $permissionSlugs) {
            $role = Role::where('slug', $roleSlug)->first();

            if (! $role) {
                continue;
            }

            $permissionIds = Permission::whereIn('slug', $permissionSlugs)->pluck('id');
            $role->permissions()->syncWithoutDetaching($permissionIds);
        }
    }
}

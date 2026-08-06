<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Staff;
use App\Models\Student;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProprietorController extends Controller
{
    public function __construct(private CurrentContextService $context)
    {
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $resolved = $this->context->resolve($user);
        $school = $resolved['school'];

        if (!$school) {
            return response()->json([
                'success' => false,
                'message' => 'No active school.',
            ], 409);
        }

        $schoolId = $school['id'];
        $schoolModel = \App\Models\School::with(['organization', 'owner'])->find($schoolId);

        $currentSession = DB::table('academic_sessions')
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        $currentTerm = $currentSession
            ? DB::table('terms')
                ->where('academic_session_id', $currentSession->id)
                ->where('is_current', true)
                ->first()
            : null;

        $totalStaff = Staff::where('school_id', $schoolId)
            ->where('employment_status', 'Active')
            ->count();

        $totalStudents = Student::where('school_id', $schoolId)
            ->where('status', 'Active')
            ->count();

        $enrollmentIdsForSchool = function ($query) use ($schoolId) {
            $query->select('id')
                ->from('student_enrollments')
                ->where('school_id', $schoolId);
        };

        $studentFeeIdsForSchool = function ($query) use ($enrollmentIdsForSchool) {
            $query->select('id')
                ->from('student_fees')
                ->whereIn('student_enrollment_id', $enrollmentIdsForSchool);
        };

        $totalRevenue = DB::table('fee_payments')
            ->whereIn('student_fee_id', $studentFeeIdsForSchool)
            ->sum('amount_paid');

        $leadershipDesignations = [
            'Principal',
            'Vice Principal Academic',
            'Vice Principal Administration',
            'Bursar',
            'Cashier',
        ];

        $leadership = Staff::where('school_id', $schoolId)
            ->whereIn('designation', $leadershipDesignations)
            ->where('employment_status', 'Active')
            ->get(['designation', 'first_name', 'middle_name', 'last_name'])
            ->map(fn ($staff) => [
                'role' => $staff->designation,
                'name' => $staff->full_name,
                'status' => 'Assigned',
            ])
            ->values();

        // visibleToSchool() excludes anything logged by the software owner —
        // a Proprietor never sees platform-admin actions in their own log.
        $auditLogs = ActivityLog::where('school_id', $schoolId)
            ->visibleToSchool()
            ->with('user:id,name')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'user' => $log->user->name ?? 'System',
                'action' => $log->description ?? "{$log->module}.{$log->action}",
                'time' => $log->created_at->diffForHumans(),
            ]);

        return response()->json([
            'school_info' => [
                'name' => $schoolModel->name,
                'proprietor_name' => $schoolModel->owner->name ?? null,
                'session' => $currentSession->name ?? 'No current session set',
                'term' => $currentTerm->name ?? 'No current term set',
            ],
            'overview_stats' => [
                'total_staff' => $totalStaff,
                'total_students' => $totalStudents,
                'total_revenue' => $totalRevenue,
                'pending_approvals' => null,
            ],
            'leadership' => $leadership,
            'audit_logs' => $auditLogs,
            'recent_communications' => [],
        ]);
    }
}

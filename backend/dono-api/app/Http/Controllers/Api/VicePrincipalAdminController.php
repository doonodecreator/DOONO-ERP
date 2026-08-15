<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\DisciplineCase;
use App\Models\LeaveRequest;
use App\Models\SchoolEvent;
use App\Models\SchoolFacility;
use App\Models\Staff;
use App\Models\StaffAttendance;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class VicePrincipalAdminController extends Controller
{
    public function __construct(
        private CurrentContextService $context
    ) {
    }

    public function dashboard(Request $request)
    {
        $schoolId = $this->currentSchoolId($request);
        $today = now()->toDateString();

        $activeStaff = Staff::where('school_id', $schoolId)
            ->where('employment_status', 'Active');

        $pendingLeaves = LeaveRequest::with('staff')
            ->where('school_id', $schoolId)
            ->where('status', 'Pending')
            ->latest()
            ->limit(5)
            ->get();

        $upcomingEvents = SchoolEvent::where('school_id', $schoolId)
            ->where('start_at', '>=', now())
            ->where('status', '!=', 'Cancelled')
            ->orderBy('start_at')
            ->limit(5)
            ->get();

        $school = $this->context->currentSchool($request->user());
        $facilitiesDueInspection = SchoolFacility::where('school_id', $schoolId)
            ->whereNotNull('next_inspection_at')
            ->whereDate('next_inspection_at', '<=', $today)
            ->whereNotIn('status', ['Decommissioned', 'Unavailable'])
            ->count();

        return response()->json([
            'admin_summary' => [
                'vp_name' => $request->user()->name,
                'school_name' => $school?->name,
                'session' => null,
                'term' => null,
            ],
            'metrics' => [
                'total_staff' => (clone $activeStaff)->count(),
                'staff_present_today' => StaffAttendance::where('school_id', $schoolId)
                    ->whereDate('attendance_date', $today)
                    ->whereRaw('LOWER(status) = ?', ['present'])
                    ->count(),
                'pending_leave_requests' => LeaveRequest::where('school_id', $schoolId)
                    ->where('status', 'Pending')
                    ->count(),
                'open_discipline_cases' => DisciplineCase::where('school_id', $schoolId)
                    ->whereNotIn('status', ['Resolved', 'Dismissed'])
                    ->count(),
                'total_assets_count' => Asset::where('school_id', $schoolId)
                    ->where('status', '!=', 'Disposed')
                    ->count(),
                'total_facilities_count' => SchoolFacility::where('school_id', $schoolId)->count(),
                'facilities_under_maintenance' => SchoolFacility::where('school_id', $schoolId)
                    ->whereIn('status', ['Under Maintenance', 'Unavailable'])
                    ->count(),
                'facilities_due_inspection' => $facilitiesDueInspection,
            ],
            'leave_requests' => $pendingLeaves->map(fn (LeaveRequest $leave) => [
                'id' => $leave->id,
                'staff' => $leave->staff?->full_name ?? 'Unknown staff',
                'type' => $leave->leave_type,
                'duration' => $leave->start_date && $leave->end_date
                    ? ($leave->start_date->diffInDays($leave->end_date) + 1) . ' Days'
                    : '—',
                'status' => $leave->status,
            ])->values(),
            'upcoming_events' => $upcomingEvents->map(fn (SchoolEvent $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->start_at?->format('Y-m-d H:i'),
                'venue' => $event->venue ?: 'Venue not specified',
                'status' => $event->status,
            ])->values(),
        ]);
    }

    private function currentSchoolId(Request $request): int
    {
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 409, 'No active school.');

        return (int) $schoolId;
    }
}

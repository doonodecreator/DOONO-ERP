<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Communication;
use App\Models\Student;
use App\Models\Result;
use App\Models\Attendance;
use App\Models\ReportCard;
use App\Models\AcademicSession;
use App\Models\StudentEnrollment;
use App\Models\StudentFee;
use App\Models\Timetable;
use App\Models\Assignment;
use App\Services\Academic\ReportCardService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function __construct(
        protected CurrentContextService $context,
        protected ReportCardService $reportCardService
    ) {}

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($user)?->id;

        $student = Student::where('user_id', $user->id)
            ->when($schoolId, fn($q) => $q->where('school_id', $schoolId))
            ->with(['class', 'stream', 'enrollments'])
            ->first();

        if (!$student) {
            // Fallback for demo or unlinked accounts
            return response()->json([
                'student_profile' => ['first_name' => $user->name, 'last_name' => '', 'admission_number' => 'UNLINKED'],
                'upcoming_assignments' => [],
                'recent_results' => [],
                'timetable' => [],
                'timetable_context' => [],
                'attendance_summary' => ['present' => 0, 'absent' => 0],
                'outstanding_fees' => 0.00,
                'fee_breakdown' => [],
                'recent_notices' => [],
            ]);
        }

        $recentNotices = Communication::query()
            ->where('school_id', $student->school_id)
            ->where(function ($query) use ($user) {
                $query->where(function ($published) {
                    $published->where('is_published', true)->whereIn('audience', ['all', 'students']);
                })->orWhere('recipient_id', $user->id);
            })
            ->latest('published_at')
            ->take(5)
            ->get(['id', 'subject', 'body', 'audience', 'published_at', 'read_at']);

        $enrollmentIds = $student->enrollments()->pluck('id');

        $fees = StudentFee::query()
            ->whereIn('student_enrollment_id', $enrollmentIds)
            ->where('status', '!=', 'paid')
            ->with('feeCategory')
            ->get();
        $feeBreakdown = $fees->map(fn ($fee) => [
            'student_fee_id' => $fee->id,
            'student_id' => $student->id,
            'fee_category_id' => $fee->fee_category_id,
            'category' => $fee->feeCategory?->name ?? 'School fee',
            'amount' => (float) $fee->amount_due,
            'status' => $fee->status,
        ])->values();

        $recentResults = Result::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('is_published', true)
            ->with('subject')
            ->latest('published_at')
            ->take(5)
            ->get()
            ->map(fn($r) => [
                'subject' => $r->subject?->name ?? 'Subject',
                'score' => $r->total_score,
                'grade' => $r->grade ?? '-'
            ]);

        $presentCount = Attendance::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('status', 'Present')
            ->count();
        $absentCount = Attendance::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('status', 'Absent')
            ->count();

        $currentSession = AcademicSession::query()
            ->where('school_id', $student->school_id)
            ->where('is_current', true)
            ->first();
        $currentTerm = $currentSession
            ? $currentSession->terms()->where('is_current', true)->first()
                ?? $currentSession->terms()->orderBy('start_date')->first()
            : null;
        $currentEnrollment = StudentEnrollment::query()
            ->where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->where('status', 'Active')
            ->when($currentSession, fn ($query) => $query->where('academic_session_id', $currentSession->id))
            ->when($currentTerm, fn ($query) => $query->where('term_id', $currentTerm->id))
            ->latest('id')
            ->first();
        $classId = $currentEnrollment?->class_id ?? $student->class_id;
        $streamId = $currentEnrollment?->stream_id ?? $student->stream_id;
        $divisionId = $currentEnrollment?->division_id ?? $student->division_id;

        $timetable = Timetable::query()
            ->where('school_id', $student->school_id)
            ->where('academic_session_id', $currentSession?->id ?? 0)
            ->where('term_id', $currentTerm?->id ?? 0)
            ->where('is_active', true)
            ->where(function ($query) use ($classId, $streamId, $divisionId) {
                $query->where('target_type', 'school')
                    ->orWhere(function ($divisionQuery) use ($divisionId) {
                        $divisionQuery->where('target_type', 'division')->where('division_id', $divisionId);
                    })
                    ->orWhere(function ($classQuery) use ($classId, $streamId) {
                        $classQuery->where('target_type', 'class')
                            ->where('class_id', $classId)
                            ->where(function ($streamQuery) use ($streamId) {
                                $streamQuery->whereNull('stream_id');
                                if ($streamId) {
                                    $streamQuery->orWhere('stream_id', $streamId);
                                }
                            });
                    });
            })
            ->with(['class', 'stream', 'subject', 'staff'])
            ->orderByRaw("FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
            ->orderBy('start_time')
            ->orderBy('event_date')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'entry_type' => $item->entry_type ?? 'lesson',
                'schedule_mode' => $item->schedule_mode ?? 'weekly',
                'title' => $item->title ?: $item->subject?->name,
                'description' => $item->description,
                'day_of_week' => $item->day_of_week,
                'start_time' => $item->start_time,
                'end_time' => $item->end_time,
                'event_date' => $item->event_date?->toDateString(),
                'effective_from' => $item->effective_from?->toDateString(),
                'effective_until' => $item->effective_until?->toDateString(),
                'class' => $item->class?->name,
                'stream' => $item->stream?->name,
                'subject' => $item->subject?->name,
                'teacher' => $item->staff?->full_name,
                'room' => $item->room,
            ])->values();

        $classIds = $student->enrollments()->pluck('class_id')->push($student->class_id)->filter()->unique();
        $upcomingAssignments = Assignment::where('school_id', $student->school_id)
            ->whereIn('class_id', $classIds)
            ->where('status', 'Published')
            ->with(['class', 'subject'])
            ->latest('due_date')
            ->take(10)
            ->get()
            ->map(fn ($assignment) => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'subject' => $assignment->subject?->name,
                'class' => $assignment->class?->name,
                'due_date' => $assignment->due_date?->toDateString(),
            ]);

        return response()->json([
            'student_profile' => $student,
            'upcoming_assignments' => $upcomingAssignments,
            'recent_results' => $recentResults,
            'timetable' => $timetable,
            'timetable_context' => [
                'academic_session' => $currentSession?->name,
                'term' => $currentTerm?->name,
                'class' => $currentEnrollment?->class?->name ?? $student->class?->name,
                'stream' => $currentEnrollment?->stream?->name ?? $student->stream?->name,
            ],
            'attendance_summary' => [
                'present' => $presentCount,
                'absent' => $absentCount
            ],
            'outstanding_fees' => (float) $fees->sum('amount_due'),
            'fee_breakdown' => $feeBreakdown,
            'recent_notices' => $recentNotices
        ]);
    }

    public function downloadLatestReportCard(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        $student = Student::where('user_id', $request->user()->id)
            ->when($schoolId, fn ($query) => $query->where('school_id', $schoolId))
            ->first();

        abort_unless($student, 404, 'Student profile is not linked to this account.');

        $reportCard = ReportCard::where('school_id', $student->school_id)
            ->whereHas('studentEnrollment', fn ($query) => $query->where('student_id', $student->id))
            ->where('is_published', true)
            ->latest()
            ->first();

        abort_unless($reportCard, 404, 'No published report card is available yet.');

        return $this->reportCardService->downloadPdf(
            $reportCard->studentEnrollment,
            $reportCard->academic_session_id,
            $reportCard->term_id
        );
    }
}

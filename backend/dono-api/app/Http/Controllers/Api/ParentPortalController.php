<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Communication;
use App\Models\Guardian;
use App\Models\StudentFee;
use App\Models\Student;
use App\Models\ReportCard;
use App\Models\StudentResultSummary;
use App\Models\Result;
use App\Services\Academic\ReportCardService;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class ParentPortalController extends Controller
{
    public function __construct(
        protected ReportCardService $reportCardService,
        protected CurrentContextService $context,
    ) {}

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $schoolId = $this->context->currentSchool($user)?->id;
        abort_unless($schoolId, 403, 'Select an active school before opening the parent portal.');

        // Find only the guardian record linked to this user and active school.
        $guardian = Guardian::where('user_id', $user->id)
            ->when($schoolId, fn ($query) => $query->where('school_id', $schoolId))
            ->with(['students.class', 'students.division', 'students.stream'])
            ->first();

        if (!$guardian) {
            return response()->json([
                'parent_profile' => ['first_name' => $user->name, 'last_name' => ''],
                'children' => [],
                'recent_notices' => [],
                'outstanding_fees' => 0.00,
                'fee_breakdown' => []
            ]);
        }

        $recentNotices = Communication::query()
            ->where('school_id', $guardian->school_id)
            ->where(function ($query) use ($user) {
                $query->where(function ($published) {
                    $published->where('is_published', true)->whereIn('audience', ['all', 'parents']);
                })->orWhere('recipient_id', $user->id);
            })
            ->latest('published_at')
            ->take(5)
            ->get(['id', 'subject', 'body', 'audience', 'published_at', 'read_at']);

        $children = $guardian->students
            ->where('school_id', $guardian->school_id)
            ->values();
        $studentIds = $children->pluck('id');

        // Fetch real outstanding fees for all linked children in this school only.
        $fees = StudentFee::whereIn('student_enrollment_id', function($query) use ($studentIds, $guardian) {
                $query->select('id')->from('student_enrollments')
                    ->where('school_id', $guardian->school_id)
                    ->whereIn('student_id', $studentIds);
            })
            ->where('status', '!=', 'paid')
            ->with(['feeCategory', 'studentEnrollment.student'])
            ->get();

        $feeBreakdown = $fees->groupBy('studentEnrollment.student.id')->map(function ($studentFees) {
            $student = $studentFees->first()->studentEnrollment->student;
            return [
                'student_name' => $student->first_name . ' ' . $student->last_name,
                'total_due' => $studentFees->sum('amount_due'),
                'items' => $studentFees->map(fn($f) => [
                    'student_fee_id' => $f->id,
                    'student_id' => $student->id,
                    'fee_category_id' => $f->fee_category_id,
                    'category' => $f->feeCategory->name,
                    'amount' => $f->amount_due,
                    'status' => $f->status
                ])
            ];
        });

        return response()->json([
            'parent_profile' => [
                'id' => $guardian->id,
                'first_name' => $guardian->first_name,
                'last_name' => $guardian->last_name,
                'email' => $guardian->email,
                'school_id' => $guardian->school_id,
            ],
            'children' => $children->map(fn ($child) => [
                'id' => $child->id,
                'first_name' => $child->first_name,
                'middle_name' => $child->middle_name,
                'last_name' => $child->last_name,
                'full_name' => $child->full_name,
                'admission_number' => $child->admission_number,
                'photo_url' => app(\App\Services\MediaStorageService::class)->url($child->photo),
                'class' => $child->class?->name,
                'stream' => $child->stream?->name,
                'division' => $child->division?->name,
            ])->values(),
            'recent_notices' => $recentNotices,
            'outstanding_fees' => $fees->sum('amount_due'),
            'fee_breakdown' => $feeBreakdown
        ]);
    }

    public function downloadReportCard(Request $request, Student $student)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        $guardian = Guardian::where('user_id', $request->user()->id)
            ->when($schoolId, fn ($query) => $query->where('school_id', $schoolId))
            ->whereHas('students', fn ($query) => $query->whereKey($student->id)->where('school_id', $schoolId))
            ->first();

        abort_unless($schoolId && (int) $student->school_id === (int) $schoolId, 404, 'Child not found in the active school.');

        abort_unless($guardian, 403, 'This child is not linked to your parent account.');

        $reportCard = ReportCard::where('school_id', $student->school_id)
            ->whereHas('studentEnrollment', fn ($query) => $query->where('student_id', $student->id))
            ->where('is_published', true)
            ->latest()
            ->first();

        abort_unless($reportCard, 404, 'No published report card is available for this child yet.');
        $summaryPublished = StudentResultSummary::where('student_enrollment_id', $reportCard->student_enrollment_id)->where('academic_session_id', $reportCard->academic_session_id)->where('term_id', $reportCard->term_id)->where('is_published', true)->exists();
        abort_unless($summaryPublished, 404, 'The final academic result has not been published yet.');
        abort_unless(Result::where('student_enrollment_id', $reportCard->student_enrollment_id)->where('academic_session_id', $reportCard->academic_session_id)->where('term_id', $reportCard->term_id)->where('is_published', true)->exists(), 404, 'The final subject results have not been published yet.');
        ActivityLogService::log('report_cards', 'parent_downloaded', 'A parent downloaded a published report card.', $reportCard, ['student_id' => $student->id], $schoolId);

        return $this->reportCardService->downloadPdf(
            $reportCard->studentEnrollment,
            $reportCard->academic_session_id,
            $reportCard->term_id
        );
    }
}

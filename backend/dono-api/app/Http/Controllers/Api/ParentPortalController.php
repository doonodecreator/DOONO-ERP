<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentModel;
use App\Models\StudentFee;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class ParentPortalController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($user)?->id;

        $parent = null;
        if ($schoolId) {
            $parent = ParentModel::where('school_id', $schoolId)
                ->where(fn($q) => $q->where('father_email', $user->email)->orWhere('mother_email', $user->email)->orWhere('guardian_email', $user->email))
                ->with('students.class', 'students.division', 'students.enrollments')
                ->first();
        }

        if (!$parent) {
            $parent = ParentModel::with('students.class', 'students.division', 'students.enrollments')->first();
        }

        if (!$parent) {
            return response()->json([
                'parent_profile' => ['first_name' => 'Demo', 'last_name' => 'Parent'],
                'children' => [],
                'recent_notices' => [],
                'outstanding_fees' => 0.00
            ]);
        }

        $children = $parent->students;
        $enrollmentIds = $children->flatMap(fn($s) => $s->enrollments)->pluck('id');

        $outstandingFees = 0.00;
        if ($enrollmentIds->isNotEmpty()) {
            $fees = StudentFee::whereIn('student_enrollment_id', $enrollmentIds)->get();
            $outstandingFees = $fees->sum(fn($fee) => $fee->balance);
        }

        return response()->json([
            'parent_profile' => $parent,
            'children' => $children,
            'recent_notices' => [],
            'outstanding_fees' => max(0, $outstandingFees)
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportCard;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class ReportCardVerificationController extends Controller
{
    public function show(Request $request, string $token)
    {
        $reportCard = ReportCard::query()
            ->with([
                'school:id,name',
                'studentEnrollment.student:id,first_name,middle_name,last_name,admission_number',
                'academicSession:id,name',
                'term:id,name',
            ])
            ->where('verification_token', $token)
            ->where('is_published', true)
            ->first();

        if (!$reportCard) {
            return response()->json([
                'valid' => false,
                'message' => 'This document could not be verified or is no longer published.',
            ], 404);
        }

        $student = $reportCard->studentEnrollment?->student;
        $studentName = trim(implode(' ', array_filter([
            $student?->first_name,
            $student?->middle_name,
            $student?->last_name,
        ])));

        ActivityLogService::log(
            module: 'report_card_verification',
            action: 'verified',
            description: 'A published report card verification token was checked.',
            schoolId: $reportCard->school_id,
            properties: ['report_card_id' => $reportCard->id],
        );

        return response()->json([
            'valid' => true,
            'data' => [
                'document_type' => 'Official terminal report card',
                'school' => $reportCard->school?->name,
                'student_name' => $studentName ?: 'Learner',
                'academic_session' => $reportCard->academicSession?->name,
                'term' => $reportCard->term?->name,
                'average_score' => $reportCard->average_score,
                'overall_grade' => $reportCard->overall_grade,
                'position' => $reportCard->position,
                'promotion_status' => $reportCard->promotion_status,
                'published_at' => $reportCard->updated_at,
            ],
        ]);
    }
}

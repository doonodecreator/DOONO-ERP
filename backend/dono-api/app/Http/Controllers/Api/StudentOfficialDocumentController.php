<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GraduationRecord;
use App\Models\Result;
use App\Models\Student;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class StudentOfficialDocumentController extends Controller
{
    public function certificate(Request $request, GraduationRecord $graduationRecord)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $graduationRecord->school_id === $schoolId, 404);
        abort_unless(in_array($graduationRecord->status, ['graduated', 'alumni'], true), 409, 'A certificate is available only for a graduated or alumni record.');
        abort_unless($graduationRecord->certificate_number, 409, 'Add a certificate number before generating the certificate.');

        $graduationRecord->load([
            'school:id,name,address,phone,email',
            'student:id,school_id,admission_number,first_name,middle_name,last_name,gender',
            'academicSession:id,name',
        ]);

        $this->audit('certificate_downloaded', 'An official graduation certificate was downloaded.', $graduationRecord, $schoolId);
        return Pdf::loadView('pdf.certificate', ['record' => $graduationRecord])->setPaper('a4', 'landscape')->download('certificate-'.$graduationRecord->certificate_number.'.pdf');
    }

    public function transcript(Request $request, Student $student)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $student->school_id === $schoolId, 404);

        $student->load([
            'school:id,name,address,phone,email',
            'division:id,name',
            'class:id,name',
            'stream:id,name',
        ]);
        $results = Result::query()
            ->where('school_id', $schoolId)
            ->where('is_published', true)
            ->whereHas('studentEnrollment', fn ($query) => $query->where('student_id', $student->id))
            ->with(['subject:id,name', 'academicSession:id,name', 'term:id,name'])
            ->orderByDesc('academic_session_id')
            ->orderBy('term_id')
            ->orderBy('subject_id')
            ->get();

        $this->audit('transcript_downloaded', 'An official published-result transcript was downloaded.', $student, $schoolId, ['result_count' => $results->count()]);
        return Pdf::loadView('pdf.transcript', ['student' => $student, 'results' => $results])->setPaper('a4', 'portrait')->download('transcript-'.$student->admission_number.'.pdf');
    }

    public function idCard(Request $request, Student $student)
    {
        $schoolId = $this->requireSchool($request);
        $user = $request->user();
        abort_unless(
            $user?->isSuperAdmin() || $user?->hasPermission('issue_student_id_cards', $schoolId),
            403,
            'Only authorized school staff may issue student ID cards.'
        );
        abort_unless((int) $student->school_id === $schoolId, 404);
        abort_unless(strtolower((string) $student->status) === 'active', 409, 'An ID card can only be generated for an active student.');

        $student->load([
            'school:id,name,short_name,school_code,address,phone,email,website,logo,principal_signature,school_stamp,primary_color,secondary_color,accent_color,allow_branding',
            'division:id,name',
            'class:id,name',
            'stream:id,name',
            'guardians:id,school_id,first_name,last_name,phone,email',
        ]);

        $school = $student->school;
        $media = app(\App\Services\MediaStorageService::class);
        $guardian = $student->guardians->first();
        $allowBranding = (bool) ($school?->allow_branding ?? true);
        $safeColor = static function ($value, string $fallback): string {
            return is_string($value) && preg_match('/^#[0-9A-Fa-f]{6}$/', $value) ? $value : $fallback;
        };

        $cardData = [
            'student' => $student,
            'school' => $school,
            'studentPhoto' => $media->inlineDataUri($student->photo),
            'schoolLogo' => $media->inlineDataUri($school?->logo),
            'principalSignature' => $media->inlineDataUri($school?->principal_signature),
            'schoolStamp' => $media->inlineDataUri($school?->school_stamp),
            'guardian' => $guardian,
            'primaryColor' => $allowBranding ? $safeColor($school?->primary_color, '#1E3A8A') : '#1E3A8A',
            'secondaryColor' => $allowBranding ? $safeColor($school?->secondary_color, '#0F172A') : '#0F172A',
            'accentColor' => $allowBranding ? $safeColor($school?->accent_color, '#F59E0B') : '#F59E0B',
            'generatedAt' => now(),
        ];

        $this->audit('student_id_downloaded', 'A front-and-back student ID card was downloaded.', $student, $schoolId, [
            'has_student_photo' => (bool) $cardData['studentPhoto'],
            'has_school_logo' => (bool) $cardData['schoolLogo'],
            'has_authorization_assets' => (bool) ($cardData['principalSignature'] || $cardData['schoolStamp']),
            'has_emergency_contact' => (bool) $guardian,
            'format' => 'ISO/IEC 7810 ID-1 / CR80 two-page PDF',
        ]);

        return Pdf::loadView('pdf.student-id-card', $cardData)
            ->setPaper([0, 0, 243.78, 153.07], 'portrait')
            ->download('student-id-'.$student->admission_number.'.pdf');
    }

    private function audit(string $action, string $description, object $subject, int $schoolId, array $properties = []): void
    {
        ActivityLogService::log(
            module: 'official_documents',
            action: $action,
            description: $description,
            subject: $subject,
            schoolId: $schoolId,
            properties: $properties,
        );
    }
}

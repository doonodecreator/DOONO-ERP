<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LinkParentPortalAccountRequest;
use App\Http\Requests\LinkStudentPortalAccountRequest;
use App\Http\Resources\ParentResource;
use App\Http\Resources\StudentResource;
use App\Models\ParentModel;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\EmailVerificationService;
use App\Services\PortalAccountService;
use Illuminate\Http\Request;

class PortalAccountController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly PortalAccountService $portalAccounts,
        private readonly EmailVerificationService $verification
    ) {
    }

    public function linkStudent(
        LinkStudentPortalAccountRequest $request,
        Student $student
    ) {
        $schoolId = $this->ensureSchool($request, $student->school_id);
        $linkedStudent = $this->portalAccounts->linkStudent(
            $student,
            $request->validated(),
            $schoolId
        );
        $verificationSent = $this->verification->send($linkedStudent->user);

        ActivityLogService::log(
            module: 'portal_accounts',
            action: 'student_linked',
            description: "Student {$linkedStudent->admission_number} linked to a portal account.",
            subject: $linkedStudent,
            schoolId: $schoolId,
        );

        return response()->json([
            'data' => new StudentResource($linkedStudent->load([
            'school',
            'division',
            'class',
            'stream',
            'academicSession',
        ])),
            'verification_email_sent' => $verificationSent,
        ]);
    }

    public function linkParent(
        LinkParentPortalAccountRequest $request,
        ParentModel $parent
    ) {
        $schoolId = $this->ensureSchool($request, $parent->school_id);
        $guardian = $this->portalAccounts->linkParent(
            $parent,
            $request->validated(),
            $schoolId
        );
        $verificationSent = $this->verification->send($guardian->user);

        ActivityLogService::log(
            module: 'portal_accounts',
            action: 'parent_linked',
            description: "Parent record {$parent->id} linked to a portal account.",
            subject: $guardian,
            schoolId: $schoolId,
        );

        return response()->json([
            'data' => new ParentResource($parent->load([
            'school',
            'students',
            'guardian.user',
        ])),
            'verification_email_sent' => $verificationSent,
        ]);
    }

    private function ensureSchool(Request $request, int $recordSchoolId): int
    {
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 409, 'No active school.');
        abort_unless((int) $schoolId === $recordSchoolId, 403);

        return (int) $schoolId;
    }
}

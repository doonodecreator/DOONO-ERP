<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentPromotionRequest;
use App\Http\Requests\UpdateStudentPromotionRequest;
use App\Http\Resources\StudentPromotionResource;
use App\Models\StudentPromotion;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\StudentLifecycleService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class StudentPromotionController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly StudentLifecycleService $lifecycle,
    ) {}

    public function index(Request $request)
    {
        $query = StudentPromotion::with([
            'school',
            'student',
            'fromAcademicSession',
            'toAcademicSession',
            'fromDivision',
            'toDivision',
            'fromClass',
            'toClass',
            'fromStream',
            'toStream',
        ]);

        if (! $request->user()->isSuperAdmin()) {
            $query->where('school_id', $this->context->currentSchool($request->user())?->id);
        }

        return StudentPromotionResource::collection($query->latest()->paginate(10));
    }

    public function store(StoreStudentPromotionRequest $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'No active school selected.');

        $result = $this->lifecycle->applyPromotion(
            $request->validated(),
            (int) $schoolId,
            (int) $request->user()->id,
        );

        ActivityLogService::log(
            module: 'student_lifecycle',
            action: strtolower((string) $result['promotion']->promotion_status),
            description: "Student lifecycle decision recorded as {$result['promotion']->promotion_status}.",
            subject: $result['promotion'],
            schoolId: (int) $schoolId,
            properties: [
                'student_id' => $result['promotion']->student_id,
                'from_academic_session_id' => $result['promotion']->from_academic_session_id,
                'to_academic_session_id' => $result['promotion']->to_academic_session_id,
                'target_enrollment_count' => $result['target_enrollments']->count(),
            ],
        );

        return response()->json([
            'data' => new StudentPromotionResource($result['promotion']),
            'student' => $result['student'],
            'target_enrollments' => $result['target_enrollments'],
            'graduation' => $result['graduation'],
            'message' => match ($result['promotion']->promotion_status) {
                'Promoted' => 'Promotion recorded and the student was enrolled in every term of the target session.',
                'Repeated' => 'Repeat decision recorded and the student was enrolled in every term of the target session at the selected placement.',
                'Transferred' => 'Transfer recorded and the student’s active enrollment was closed.',
                'Graduated' => 'Graduation recorded and the student’s active enrollment and portal learning state were closed.',
                default => 'Student lifecycle decision recorded.',
            },
        ], 201);
    }

    public function show(Request $request, StudentPromotion $studentPromotion)
    {
        $this->assertSchoolAccess($request, $studentPromotion);

        return new StudentPromotionResource($studentPromotion->load([
            'school',
            'student',
            'fromAcademicSession',
            'toAcademicSession',
            'fromDivision',
            'toDivision',
            'fromClass',
            'toClass',
            'fromStream',
            'toStream',
        ]));
    }

    public function update(
        UpdateStudentPromotionRequest $request,
        StudentPromotion $studentPromotion
    ) {
        $this->assertSchoolAccess($request, $studentPromotion);

        $data = $request->safe()->only(['promotion_date', 'remarks']);
        if ($data === []) {
            throw ValidationException::withMessages([
                'promotion' => ['A recorded lifecycle decision cannot change its student, sessions, placement, or status.'],
            ]);
        }

        $studentPromotion->update($data);
        ActivityLogService::log(
            module: 'student_lifecycle',
            action: 'updated_notes',
            description: 'Updated the date or remarks on a student lifecycle decision without changing its outcome.',
            subject: $studentPromotion,
            schoolId: (int) $studentPromotion->school_id,
        );

        return new StudentPromotionResource($studentPromotion->fresh()->load([
            'school',
            'student',
            'fromAcademicSession',
            'toAcademicSession',
            'fromDivision',
            'toDivision',
            'fromClass',
            'toClass',
            'fromStream',
            'toStream',
        ]));
    }

    public function destroy(Request $request, StudentPromotion $studentPromotion)
    {
        $this->assertSchoolAccess($request, $studentPromotion);

        return response()->json([
            'message' => 'Lifecycle decisions are retained as academic history and cannot be deleted. Use a new authorized correction process if the decision was wrong.',
        ], 409);
    }

    private function assertSchoolAccess(Request $request, StudentPromotion $studentPromotion): void
    {
        if ($request->user()->isSuperAdmin()) {
            return;
        }

        abort_unless(
            (int) $studentPromotion->school_id === (int) $this->context->currentSchool($request->user())?->id,
            404,
            'Promotion record not found.'
        );
    }
}

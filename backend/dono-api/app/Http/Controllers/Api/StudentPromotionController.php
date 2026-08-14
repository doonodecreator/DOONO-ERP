<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreStudentPromotionRequest;
use App\Http\Requests\UpdateStudentPromotionRequest;
use App\Http\Resources\StudentPromotionResource;
use App\Models\StudentPromotion;
use Illuminate\Http\Request;

class StudentPromotionController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    private function currentContextSchoolId(Request $request): ?int
    {
        return $this->context->currentSchool($request->user())?->id;
    }
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
            $query->where(
                'school_id',
                $this->currentContextSchoolId($request)
            );
        }

        return StudentPromotionResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreStudentPromotionRequest $request)
    {
        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
            $data['school_id'] = $this->currentContextSchoolId($request);
        }

        $promotion = StudentPromotion::create($data);

        return (new StudentPromotionResource(
            $promotion->load([
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
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, StudentPromotion $studentPromotion)
    {
        if (
            ! $request->user()->isSuperAdmin() &&
            $studentPromotion->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        return new StudentPromotionResource(
            $studentPromotion->load([
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
            ])
        );
    }

    public function update(
        UpdateStudentPromotionRequest $request,
        StudentPromotion $studentPromotion
    ) {
        if (
            ! $request->user()->isSuperAdmin() &&
            $studentPromotion->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
            unset($data['school_id']);
        }

        $studentPromotion->update($data);

        return new StudentPromotionResource(
            $studentPromotion->load([
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
            ])
        );
    }

    public function destroy(Request $request, StudentPromotion $studentPromotion)
    {
        if (
            ! $request->user()->isSuperAdmin() &&
            $studentPromotion->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $studentPromotion->delete();

        return response()->json([
            'message' => 'Student promotion deleted successfully.',
        ]);
    }
}

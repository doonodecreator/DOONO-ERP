<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreParentStudentRequest;
use App\Http\Requests\UpdateParentStudentRequest;
use App\Http\Resources\ParentStudentResource;
use App\Models\ParentStudent;
use App\Models\Student;
use App\Services\CurrentContextService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ParentStudentController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    public function index(Request $request)
    {
        return ParentStudentResource::collection(
            $this->schoolScopedQuery($request)->latest()->get()
        );
    }

    public function store(StoreParentStudentRequest $request)
    {
        $data = $request->validated();
        $data['is_primary_contact'] = $data['is_primary_contact'] ?? true;

        $parentStudent = DB::transaction(function () use ($data) {
            Student::whereKey($data['student_id'])->lockForUpdate()->firstOrFail();

            if ($data['is_primary_contact']) {
                ParentStudent::where('student_id', $data['student_id'])
                    ->update(['is_primary_contact' => false]);
            }

            return ParentStudent::create($data);
        });

        return new ParentStudentResource(
            $parentStudent->load(['parent', 'student'])
        );
    }

    public function show(Request $request, ParentStudent $parentStudent)
    {
        $this->ensureSchoolScope($request, $parentStudent);

        return new ParentStudentResource(
            $parentStudent->load(['parent', 'student'])
        );
    }

    public function update(
        UpdateParentStudentRequest $request,
        ParentStudent $parentStudent
    ) {
        $this->ensureSchoolScope($request, $parentStudent);

        $data = $request->validated();
        $data['is_primary_contact'] = $data['is_primary_contact']
            ?? $parentStudent->is_primary_contact;

        DB::transaction(function () use ($parentStudent, $data) {
            Student::whereKey($data['student_id'])->lockForUpdate()->firstOrFail();

            if ($data['is_primary_contact']) {
                ParentStudent::where('student_id', $data['student_id'])
                    ->where('id', '!=', $parentStudent->id)
                    ->update(['is_primary_contact' => false]);
            }

            $parentStudent->update($data);
        });

        return new ParentStudentResource(
            $parentStudent->load(['parent', 'student'])
        );
    }

    public function destroy(Request $request, ParentStudent $parentStudent)
    {
        $this->ensureSchoolScope($request, $parentStudent);
        $parentStudent->delete();

        return response()->json([
            'message' => 'Relationship deleted successfully.',
        ]);
    }

    private function schoolScopedQuery(Request $request): Builder
    {
        $query = ParentStudent::with(['parent', 'student']);
        $schoolId = $this->currentSchoolId($request);

        if ($schoolId) {
            return $query
                ->whereHas('parent', fn (Builder $query) => $query->where(
                    'school_id',
                    $schoolId
                ))
                ->whereHas('student', fn (Builder $query) => $query->where(
                    'school_id',
                    $schoolId
                ));
        }

        abort_unless($request->user()?->isSuperAdmin(), 403, 'Unauthorized.');

        return $query;
    }

    private function ensureSchoolScope(
        Request $request,
        ParentStudent $parentStudent
    ): void {
        $schoolId = $this->currentSchoolId($request);

        if (! $schoolId) {
            abort_unless($request->user()?->isSuperAdmin(), 403, 'Unauthorized.');

            return;
        }

        $parentStudent->loadMissing(['parent', 'student']);

        abort_unless(
            $parentStudent->parent?->school_id === $schoolId &&
            $parentStudent->student?->school_id === $schoolId,
            403,
            'Unauthorized.'
        );
    }

    private function currentSchoolId(Request $request): ?int
    {
        return $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;
    }
}

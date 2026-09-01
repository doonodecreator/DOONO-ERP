<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreParentStudentRequest;
use App\Http\Requests\UpdateParentStudentRequest;
use App\Http\Resources\ParentStudentResource;
use App\Models\ParentStudent;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\PortalAccountService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ParentStudentController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly PortalAccountService $portalAccounts,
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

        $schoolId = $this->requireSchool($request);
        $parentStudent = DB::transaction(function () use ($data) {
            Student::whereKey($data['student_id'])->lockForUpdate()->firstOrFail();

            if ($data['is_primary_contact']) {
                ParentStudent::where('student_id', $data['student_id'])
                    ->update(['is_primary_contact' => false]);
            }

            return ParentStudent::create($data);
        });
        $this->portalAccounts->syncParentChildren($parentStudent->parent()->firstOrFail(), $schoolId);
        ActivityLogService::log(
            module: 'parent_student_links',
            action: 'created',
            description: 'A parent-child portal relationship was created or synchronized.',
            subject: $parentStudent,
            schoolId: $schoolId,
            properties: ['parent_id' => $parentStudent->parent_id, 'student_id' => $parentStudent->student_id],
        );

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

        $schoolId = $this->requireSchool($request);
        $oldParentId = $parentStudent->parent_id;
        DB::transaction(function () use ($parentStudent, $data) {
            Student::whereKey($data['student_id'])->lockForUpdate()->firstOrFail();

            if ($data['is_primary_contact']) {
                ParentStudent::where('student_id', $data['student_id'])
                    ->where('id', '!=', $parentStudent->id)
                    ->update(['is_primary_contact' => false]);
            }

            $parentStudent->update($data);
        });
        $this->portalAccounts->syncParentChildren($parentStudent->parent()->firstOrFail(), $schoolId);
        if ((int) $oldParentId !== (int) $parentStudent->parent_id) {
            $oldParent = \App\Models\ParentModel::query()->find($oldParentId);
            if ($oldParent) $this->portalAccounts->syncParentChildren($oldParent, $schoolId);
        }
        ActivityLogService::log(
            module: 'parent_student_links',
            action: 'updated',
            description: 'A parent-child portal relationship was corrected and synchronized.',
            subject: $parentStudent,
            schoolId: $schoolId,
            properties: ['parent_id' => $parentStudent->parent_id, 'student_id' => $parentStudent->student_id],
        );

        return new ParentStudentResource(
            $parentStudent->load(['parent', 'student'])
        );
    }

    public function destroy(Request $request, ParentStudent $parentStudent)
    {
        $this->ensureSchoolScope($request, $parentStudent);
        $schoolId = $this->requireSchool($request);
        $parent = $parentStudent->parent()->firstOrFail();
        $parentStudent->delete();
        $this->portalAccounts->syncParentChildren($parent, $schoolId);
        ActivityLogService::log(
            module: 'parent_student_links',
            action: 'deleted',
            description: 'A parent-child portal relationship was removed and synchronized.',
            schoolId: $schoolId,
            properties: ['parent_id' => $parent->id, 'student_id' => $parentStudent->student_id],
        );

        return response()->json([
            'message' => 'Relationship deleted successfully.',
        ]);
    }

    private function schoolScopedQuery(Request $request): Builder
    {
        $query = ParentStudent::with(['parent', 'student']);
        $schoolId = $this->requireSchool($request);

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
        $schoolId = $this->requireSchool($request);

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

}

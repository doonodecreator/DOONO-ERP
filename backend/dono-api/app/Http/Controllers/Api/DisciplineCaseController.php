<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewDisciplineCaseRequest;
use App\Http\Requests\StoreDisciplineCaseRequest;
use App\Http\Resources\DisciplineCaseResource;
use App\Models\DisciplineCase;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\DisciplineCaseService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DisciplineCaseController extends Controller
{
    private const MANAGEMENT_ROLES = [
        'proprietor',
        'principal',
        'vice_principal_admin',
    ];

    private const REPORTER_ROLES = [
        'proprietor',
        'principal',
        'vice_principal_admin',
        'nursery_head',
        'primary_headmaster',
        'secondary_principal',
        'teacher',
        'form_teacher',
    ];

    public function __construct(
        private CurrentContextService $context,
        private DisciplineCaseService $disciplineCaseService
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $isManagement = $this->isManagement($request, $schoolId);

        abort_unless($isManagement || $this->mayReport($request, $schoolId), 403);

        $query = DisciplineCase::with(['student', 'reporter', 'reviewer'])
            ->where('school_id', $schoolId)
            ->when(!$isManagement, function ($query) use ($request) {
                $query->where('reported_by', $request->user()->id);
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('status', $request->input('status'));
            })
            ->when($request->filled('student_id'), function ($query) use ($request) {
                $query->where('student_id', $request->integer('student_id'));
            })
            ->latest('incident_date')
            ->latest('id');

        return DisciplineCaseResource::collection(
            $query->paginate($this->perPage($request))
        );
    }

    public function options(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $isManagement = $this->isManagement($request, $schoolId);

        abort_unless($isManagement || $this->mayReport($request, $schoolId), 403);

        $students = Student::where('school_id', $schoolId)
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->input('search'));
                $query->where(function ($query) use ($search) {
                    $query->where('admission_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(50)
            ->get();

        return response()->json([
            'can_manage' => $isManagement,
            'data' => $students->map(fn (Student $student) => [
                'id' => $student->id,
                'admission_number' => $student->admission_number,
                'full_name' => $student->full_name,
            ])->values(),
        ]);
    }

    public function store(StoreDisciplineCaseRequest $request)
    {
        $schoolId = $this->requireSchool($request);

        abort_unless($this->mayReport($request, $schoolId), 403);

        $disciplineCase = $this->disciplineCaseService->create([
            ...$request->validated(),
            'school_id' => $schoolId,
            'reported_by' => $request->user()->id,
        ]);

        ActivityLogService::log(
            module: 'discipline_cases',
            action: 'reported',
            description: "Discipline case {$disciplineCase->case_number} reported.",
            subject: $disciplineCase,
            schoolId: $schoolId,
        );

        return (new DisciplineCaseResource(
            $disciplineCase->load(['student', 'reporter', 'reviewer'])
        ))->response()->setStatusCode(201);
    }

    public function show(Request $request, DisciplineCase $disciplineCase)
    {
        $schoolId = $this->requireSchool($request);
        $this->ensureVisibleToReporterOrManagement($request, $disciplineCase, $schoolId);

        return new DisciplineCaseResource(
            $disciplineCase->load(['student', 'reporter', 'reviewer'])
        );
    }

    public function review(
        ReviewDisciplineCaseRequest $request,
        DisciplineCase $disciplineCase
    ) {
        $schoolId = $this->requireSchool($request);

        abort_unless($this->isManagement($request, $schoolId), 403);
        abort_unless($disciplineCase->school_id === $schoolId, 403);

        if (in_array($disciplineCase->status, ['Resolved', 'Dismissed'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Resolved or dismissed discipline cases cannot be reviewed again.'],
            ]);
        }

        if ($disciplineCase->reported_by === $request->user()->id) {
            throw ValidationException::withMessages([
                'status' => ['You cannot review your own discipline case report.'],
            ]);
        }

        $data = $request->validated();
        $updates = [
            'status' => $data['status'],
            'action_taken' => $data['action_taken'] ?? $disciplineCase->action_taken,
            'resolution_notes' => $data['resolution_notes'] ?? $disciplineCase->resolution_notes,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ];

        if (array_key_exists('parent_notified', $data)) {
            $updates['parent_notified'] = $data['parent_notified'];
            $updates['parent_notified_at'] = $data['parent_notified']
                ? ($disciplineCase->parent_notified_at ?? now())
                : null;
        }

        $disciplineCase->update($updates);

        ActivityLogService::log(
            module: 'discipline_cases',
            action: strtolower(str_replace(' ', '_', $data['status'])),
            description: "Discipline case {$disciplineCase->case_number} marked {$data['status']}.",
            subject: $disciplineCase,
            schoolId: $schoolId,
        );

        return new DisciplineCaseResource(
            $disciplineCase->load(['student', 'reporter', 'reviewer'])
        );
    }

    private function ensureVisibleToReporterOrManagement(
        Request $request,
        DisciplineCase $disciplineCase,
        int $schoolId
    ): void {
        abort_unless($disciplineCase->school_id === $schoolId, 403);

        if ($this->isManagement($request, $schoolId)) {
            return;
        }

        abort_unless($disciplineCase->reported_by === $request->user()->id, 403);
    }

    private function mayReport(Request $request, int $schoolId): bool
    {
        return $this->hasAnyRole($request, $schoolId, self::REPORTER_ROLES);
    }

    private function isManagement(Request $request, int $schoolId): bool
    {
        return $this->hasAnyRole($request, $schoolId, self::MANAGEMENT_ROLES);
    }

    private function hasAnyRole(Request $request, int $schoolId, array $roleSlugs): bool
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return true;
        }

        $roles = $this->context->resolve($user)['roles'] ?? [];

        return collect($roles)->contains(function (array $role) use ($schoolId, $roleSlugs) {
            return $role['school_id'] === $schoolId
                && in_array($role['slug'], $roleSlugs, true);
        });
    }


    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 25), 1), 100);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTimetableRequest;
use App\Http\Requests\UpdateTimetableRequest;
use App\Http\Resources\TimetableResource;
use App\Models\ClassModel;
use App\Models\FormTeacherAssignment;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Stream;
use App\Models\Timetable;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\TimetableService;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function __construct(
        protected TimetableService $timetableService,
        protected CurrentContextService $context,
    ) {}

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $query = Timetable::query()
            ->with(['school', 'academicSession', 'term', 'division', 'class', 'stream', 'subject', 'staff'])
            ->where('school_id', $schoolId);

        $this->applyPublicationScope($query, $request, $schoolId);
        $this->applyViewerScope($query, $request, $schoolId);
        $this->applyFilters($query, $request, $schoolId);

        $perPage = min(max((int) $request->input('per_page', 500), 1), 500);

        return TimetableResource::collection(
            $query
                ->orderByRaw("FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
                ->orderBy('start_time')
                ->orderBy('event_date')
                ->paginate($perPage),
        );
    }

    public function show(Request $request, Timetable $timetable)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $timetable->school_id === $schoolId, 404);
        $query = Timetable::query()->whereKey($timetable->id);
        $this->applyViewerScope($query, $request, $schoolId);
        abort_unless($query->exists(), 404);

        return new TimetableResource($timetable->load([
            'school', 'academicSession', 'term', 'division', 'class', 'stream', 'subject', 'staff',
        ]));
    }

    public function store(StoreTimetableRequest $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validated();
        $data['school_id'] = $schoolId;
        $this->validateRelationships($data, $schoolId);

        try {
            $timetable = $this->timetableService->createSchedule($data);
            $timetable->forceFill([
                'workflow_status' => 'draft',
                'is_active' => false,
            ])->save();

            ActivityLogService::log(
                module: 'timetable',
                action: 'created',
                description: 'A timetable entry was created as a draft.',
                subject: $timetable,
                schoolId: $schoolId,
                properties: ['entry_type' => $timetable->entry_type, 'target_type' => $timetable->target_type],
            );

            return (new TimetableResource($timetable->load([
                'school', 'academicSession', 'term', 'division', 'class', 'stream', 'subject', 'staff',
            ])))->response()->setStatusCode(201);
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['success' => false, 'message' => $exception->getMessage()], 422);
        }
    }

    public function update(UpdateTimetableRequest $request, Timetable $timetable)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $timetable->school_id === $schoolId, 404);
        $data = $request->validated();
        $merged = array_merge($timetable->toArray(), $data);
        $merged['school_id'] = $schoolId;
        $this->validateRelationships($merged, $schoolId);

        if (($merged['entry_type'] ?? 'lesson') === 'lesson' && !empty($merged['day_of_week']) && !empty($merged['start_time']) && !empty($merged['end_time'])) {
            $collision = $this->timetableService->detectCollisions(
                $schoolId,
                (int) $merged['academic_session_id'],
                (int) $merged['term_id'],
                $merged['day_of_week'],
                $merged['start_time'],
                $merged['end_time'],
                ! empty($merged['staff_id']) ? (int) $merged['staff_id'] : null,
                (int) $merged['class_id'],
                $timetable->id,
                $merged['room'] ?? null,
            );
            if ($collision['has_collision']) {
                return response()->json(['success' => false, 'message' => implode(' ', $collision['errors'])], 422);
            }
        }

        unset($data['school_id']);
        $timetable->update($data);
        $timetable->forceFill([
            'workflow_status' => 'draft',
            'is_active' => false,
            'submitted_at' => null,
            'approved_at' => null,
            'published_at' => null,
            'submitted_by' => null,
            'approved_by' => null,
            'published_by' => null,
        ])->save();

        ActivityLogService::log(
            module: 'timetable',
            action: 'updated',
            description: 'A timetable entry was edited and returned to draft for review.',
            subject: $timetable,
            schoolId: $schoolId,
            properties: ['changed_fields' => array_keys($data)],
        );

        return new TimetableResource($timetable->fresh()->load([
            'school', 'academicSession', 'term', 'division', 'class', 'stream', 'subject', 'staff',
        ]));
    }

    public function destroy(Request $request, Timetable $timetable)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $timetable->school_id === $schoolId, 404);
        $timetable->delete();
        ActivityLogService::log(
            module: 'timetable',
            action: 'deleted',
            description: 'A timetable entry was deleted.',
            schoolId: $schoolId,
            properties: ['timetable_id' => $timetable->id],
        );

        return response()->json(['message' => 'Timetable entry deleted successfully.']);
    }

    public function submit(Request $request, Timetable $timetable)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $timetable->school_id === $schoolId, 404);
        abort_unless($request->user()->hasPermission('manage_timetable', $schoolId), 403);
        abort_unless($timetable->workflow_status === 'draft', 422, 'Only draft timetable entries can be submitted for approval.');

        $timetable->forceFill([
            'workflow_status' => 'submitted',
            'is_active' => false,
            'submitted_at' => now(),
            'submitted_by' => $request->user()->id,
            'approved_at' => null,
            'approved_by' => null,
            'published_at' => null,
            'published_by' => null,
        ])->save();
        ActivityLogService::log(
            module: 'timetable',
            action: 'submitted',
            description: 'A timetable entry was submitted for approval.',
            subject: $timetable,
            schoolId: $schoolId,
        );

        return new TimetableResource($timetable->fresh()->load(['school', 'academicSession', 'term', 'division', 'class', 'stream', 'subject', 'staff']));
    }

    public function approve(Request $request, Timetable $timetable)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $timetable->school_id === $schoolId, 404);
        abort_unless($request->user()->hasPermission('approve_timetable', $schoolId), 403);
        abort_unless($timetable->workflow_status === 'submitted', 422, 'Submit the draft timetable entry before approval.');

        $timetable->forceFill([
            'workflow_status' => 'approved',
            'is_active' => false,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ])->save();
        ActivityLogService::log(
            module: 'timetable',
            action: 'approved',
            description: 'A submitted timetable entry was approved.',
            subject: $timetable,
            schoolId: $schoolId,
        );

        return new TimetableResource($timetable->fresh()->load(['school', 'academicSession', 'term', 'division', 'class', 'stream', 'subject', 'staff']));
    }

    public function publish(Request $request, Timetable $timetable)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $timetable->school_id === $schoolId, 404);
        abort_unless($request->user()->hasPermission('approve_timetable', $schoolId), 403);
        abort_unless($timetable->workflow_status === 'approved', 422, 'Approve the timetable entry before publishing it.');

        $timetable->forceFill([
            'workflow_status' => 'published',
            'is_active' => true,
            'published_at' => now(),
            'published_by' => $request->user()->id,
        ])->save();
        ActivityLogService::log(
            module: 'timetable',
            action: 'published',
            description: 'An approved timetable entry was published to its authorized audience.',
            subject: $timetable,
            schoolId: $schoolId,
        );

        return new TimetableResource($timetable->fresh()->load(['school', 'academicSession', 'term', 'division', 'class', 'stream', 'subject', 'staff']));
    }

    private function applyPublicationScope($query, Request $request, int $schoolId): void
    {
        $user = $request->user();
        if ($user->isSuperAdmin() || $user->hasPermission('manage_timetable', $schoolId) || $user->hasPermission('approve_timetable', $schoolId)) {
            return;
        }

        $query->where('is_active', true)->where(function ($statusQuery) {
            $statusQuery->where('workflow_status', 'published')->orWhereNull('workflow_status');
        });
    }

    private function applyFilters($query, Request $request, int $schoolId): void
    {
        foreach (['academic_session_id', 'term_id', 'class_id', 'entry_type', 'target_type'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->filled('division_id')) {
            $query->where('division_id', $request->input('division_id'));
        }

        if ($request->filled('from')) {
            $query->where(function ($dateQuery) use ($request) {
                $dateQuery->whereNull('effective_until')->orWhereDate('effective_until', '>=', $request->input('from'));
            });
        }

        if ($request->filled('until')) {
            $query->where(function ($dateQuery) use ($request) {
                $dateQuery->whereNull('effective_from')->orWhereDate('effective_from', '<=', $request->input('until'));
            });
        }
    }

    private function applyViewerScope($query, Request $request, int $schoolId): void
    {
        $user = $request->user();
        if ($user->isSuperAdmin() || $user->hasPermission('manage_timetable', $schoolId)) {
            return;
        }

        if ($user->hasRole('teacher', $schoolId) || $user->hasRole('form_teacher', $schoolId)) {
            $staffId = Staff::query()->where('school_id', $schoolId)->where('user_id', $user->id)->value('id');
            $assignedClassIds = collect();
            if ($staffId) {
                $assignedClassIds = Timetable::query()
                    ->where('school_id', $schoolId)
                    ->where('staff_id', $staffId)
                    ->where('entry_type', 'lesson')
                    ->pluck('class_id')
                    ->merge(FormTeacherAssignment::query()
                        ->where('school_id', $schoolId)
                        ->where('staff_id', $staffId)
                        ->where('is_active', true)
                        ->pluck('class_id'))
                    ->filter()
                    ->unique()
                    ->values();
            }

            $query->where(function ($viewerQuery) use ($staffId, $assignedClassIds) {
                $viewerQuery->where('target_type', 'school');
                if ($staffId) {
                    $viewerQuery->orWhere('staff_id', $staffId);
                }
                if ($assignedClassIds->isNotEmpty()) {
                    $viewerQuery->orWhere(function ($classQuery) use ($assignedClassIds) {
                        $classQuery->whereIn('class_id', $assignedClassIds)
                            ->whereIn('target_type', ['class', 'division']);
                    });
                }
            });
            return;
        }

        $student = Student::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->first();
        if ($student) {
            if ($student->status !== 'Active') {
                $query->whereRaw('1 = 0');
                return;
            }

            $query->where(function ($studentQuery) use ($student) {
                $studentQuery->where('target_type', 'school')
                    ->orWhere(function ($divisionQuery) use ($student) {
                        $divisionQuery->where('target_type', 'division')->where('division_id', $student->division_id);
                    })
                    ->orWhere(function ($classQuery) use ($student) {
                        $classQuery->where('target_type', 'class')
                            ->where('class_id', $student->class_id)
                            ->where(function ($streamQuery) use ($student) {
                                $streamQuery->whereNull('stream_id')->orWhere('stream_id', $student->stream_id);
                            });
                    });
            });
            return;
        }

        $query->whereRaw('1 = 0');
    }

    private function validateRelationships(array $data, int $schoolId): void
    {
        $entryType = $data['entry_type'] ?? 'lesson';
        $targetType = $data['target_type'] ?? 'class';

        if ($entryType === 'lesson' && ($targetType !== 'class' || empty($data['class_id']) || empty($data['subject_id']))) {
            abort(422, 'Lesson entries must target a class and include a subject.');
        }

        if (! empty($data['class_id'])) {
            abort_unless(ClassModel::query()->whereKey($data['class_id'])->where('division_id', $data['division_id'] ?? null)->whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->exists(), 422, 'The selected class does not belong to the selected division and school.');
        }

        if (! empty($data['stream_id'])) {
            abort_unless(Stream::query()->whereKey($data['stream_id'])->where('class_id', $data['class_id'] ?? null)->exists(), 422, 'The selected stream does not belong to the selected class.');
        }
    }
}

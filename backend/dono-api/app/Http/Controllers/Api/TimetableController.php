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

        if (($merged['entry_type'] ?? 'lesson') === 'lesson') {
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
            );
            if ($collision['has_collision']) {
                return response()->json(['success' => false, 'message' => implode(' ', $collision['errors'])], 422);
            }
        }

        unset($data['school_id']);
        $timetable->update($data);

        return new TimetableResource($timetable->fresh()->load([
            'school', 'academicSession', 'term', 'division', 'class', 'stream', 'subject', 'staff',
        ]));
    }

    public function destroy(Request $request, Timetable $timetable)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $timetable->school_id === $schoolId, 404);
        $timetable->delete();

        return response()->json(['message' => 'Timetable entry deleted successfully.']);
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

<?php

namespace App\Services;

use App\Models\Timetable;
use Illuminate\Support\Collection;

class TimetableService
{
    public function detectCollisions(
        int $schoolId,
        int $sessionId,
        int $termId,
        string $dayOfWeek,
        string $startTime,
        string $endTime,
        ?int $staffId,
        int $classId,
        ?int $ignoreId = null
    ): array {
        $conflicts = [];
        $overlap = fn ($query) => $query
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime);

        if ($staffId) {
            $teacherConflict = Timetable::query()
                ->where('school_id', $schoolId)
                ->where('academic_session_id', $sessionId)
                ->where('term_id', $termId)
                ->where('entry_type', 'lesson')
                ->where('day_of_week', $dayOfWeek)
                ->where('staff_id', $staffId)
                ->where('is_active', true)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where($overlap)
                ->first();

            if ($teacherConflict) {
                $conflicts[] = "Teacher is already scheduled in another class between {$teacherConflict->start_time} and {$teacherConflict->end_time}.";
            }
        }

        $classConflict = Timetable::query()
            ->where('school_id', $schoolId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->where('entry_type', 'lesson')
            ->where('day_of_week', $dayOfWeek)
            ->where('class_id', $classId)
            ->where('is_active', true)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where($overlap)
            ->first();

        if ($classConflict) {
            $conflicts[] = "Class already has another subject scheduled between {$classConflict->start_time} and {$classConflict->end_time}.";
        }

        return [
            'has_collision' => $conflicts !== [],
            'errors' => $conflicts,
        ];
    }

    public function createSchedule(array $data): Timetable
    {
        $entryType = $data['entry_type'] ?? 'lesson';
        if ($entryType === 'lesson') {
            $collision = $this->detectCollisions(
                (int) $data['school_id'],
                (int) $data['academic_session_id'],
                (int) $data['term_id'],
                $data['day_of_week'],
                $data['start_time'],
                $data['end_time'],
                isset($data['staff_id']) ? (int) $data['staff_id'] : null,
                (int) $data['class_id'],
            );

            if ($collision['has_collision']) {
                throw new \InvalidArgumentException(implode(' ', $collision['errors']));
            }
        }

        return Timetable::create([
            'school_id' => $data['school_id'],
            'entry_type' => $entryType,
            'schedule_mode' => $data['schedule_mode'] ?? 'weekly',
            'target_type' => $data['target_type'] ?? 'class',
            'academic_session_id' => $data['academic_session_id'],
            'term_id' => $data['term_id'],
            'division_id' => $data['division_id'] ?? null,
            'class_id' => $data['class_id'] ?? null,
            'stream_id' => $data['stream_id'] ?? null,
            'subject_id' => $data['subject_id'] ?? null,
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'staff_id' => $data['staff_id'] ?? null,
            'day_of_week' => $data['day_of_week'] ?? null,
            'start_time' => $data['start_time'] ?? null,
            'end_time' => $data['end_time'] ?? null,
            'event_date' => $data['event_date'] ?? null,
            'effective_from' => $data['effective_from'] ?? null,
            'effective_until' => $data['effective_until'] ?? null,
            'room' => $data['room'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public function getClassTimetable(int $classId, int $sessionId, int $termId): Collection
    {
        return Timetable::with(['subject', 'staff'])
            ->where('class_id', $classId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->where('is_active', true)
            ->orderByRaw("FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
            ->orderBy('start_time')
            ->get();
    }
}

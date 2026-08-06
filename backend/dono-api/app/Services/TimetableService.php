<?php

namespace App\Services;

use App\Models\Timetable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use ValidationException;

class TimetableService
{
    /**
     * Check for schedule collisions before assigning a slot.
     */
    public function detectCollisions(
        int $schoolId,
        int $sessionId,
        int $termId,
        string $dayOfWeek,
        string $startTime,
        string $endTime,
        int $staffId,
        int $classId,
        ?int $ignoreId = null
    ): array {
        $conflicts = [];

        // 1. Teacher Collision Check: Is the teacher teaching another class during this time?
        $teacherConflict = Timetable::where('school_id', $schoolId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->where('day_of_week', $dayOfWeek)
            ->where('staff_id', $staffId)
            ->where('is_active', true)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $startTime)
                          ->where('end_time', '>=', $endTime);
                    });
            })
            ->first();

        if ($teacherConflict) {
            $conflicts[] = "Teacher is already scheduled in another class between {$teacherConflict->start_time} and {$teacherConflict->end_time}.";
        }

        // 2. Class Collision Check: Does this class already have a subject scheduled at this time?
        $classConflict = Timetable::where('school_id', $schoolId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->where('day_of_week', $dayOfWeek)
            ->where('class_id', $classId)
            ->where('is_active', true)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $startTime)
                          ->where('end_time', '>=', $endTime);
                    });
            })
            ->first();

        if ($classConflict) {
            $conflicts[] = "Class already has another subject scheduled between {$classConflict->start_time} and {$classConflict->end_time}.";
        }

        return [
            'has_collision' => count($conflicts) > 0,
            'errors' => $conflicts,
        ];
    }

    /**
     * Create a timetable period entry with safety checks.
     */
    public function createSchedule(array $data): Timetable
    {
        $collision = $this->detectCollisions(
            $data['school_id'],
            $data['academic_session_id'],
            $data['term_id'],
            $data['day_of_week'],
            $data['start_time'],
            $data['end_time'],
            $data['staff_id'],
            $data['class_id']
        );

        if ($collision['has_collision']) {
            throw new \InvalidArgumentException(implode(' ', $collision['errors']));
        }

        return Timetable::create([
            'school_id' => $data['school_id'],
            'academic_session_id' => $data['academic_session_id'],
            'term_id' => $data['term_id'],
            'division_id' => $data['division_id'] ?? null,
            'class_id' => $data['class_id'],
            'stream_id' => $data['stream_id'] ?? null,
            'subject_id' => $data['subject_id'],
            'staff_id' => $data['staff_id'],
            'day_of_week' => $data['day_of_week'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'room' => $data['room'] ?? null,
            'is_active' => true,
        ]);
    }

    /**
     * Fetch complete weekly timetable for a class.
     */
    public function getClassTimetable(int $classId, int $sessionId, int $termId): Collection
    {
        return Timetable::with(['subject', 'staff'])
            ->where('class_id', $classId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();
    }
}

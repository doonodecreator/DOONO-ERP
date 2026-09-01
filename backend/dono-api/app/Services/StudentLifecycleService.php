<?php

namespace App\Services;

use App\Models\AcademicSession;
use App\Models\ClassModel;
use App\Models\Division;
use App\Models\GraduationRecord;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentPromotion;
use App\Models\Stream;
use App\Models\Term;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudentLifecycleService
{
    /**
     * Apply one authorized end-of-session decision atomically.
     *
     * A promotion/repeat creates one enrollment for every term in the target
     * session. Historical source enrollments remain in the database, but are
     * closed with the decision that was made. Graduation and transfer are
     * terminal student states and do not create a future active enrollment.
     */
    public function applyPromotion(array $data, int $schoolId, ?int $actorId = null): array
    {
        return DB::transaction(function () use ($data, $schoolId, $actorId): array {
            $student = Student::query()
                ->whereKey((int) $data['student_id'])
                ->where('school_id', $schoolId)
                ->lockForUpdate()
                ->firstOrFail();

            $fromSession = $this->schoolSession($data['from_academic_session_id'], $schoolId);
            $toSession = $this->schoolSession($data['to_academic_session_id'], $schoolId);
            $status = (string) $data['promotion_status'];

            if (in_array($status, ['Promoted', 'Repeated'], true) && (int) $fromSession->id === (int) $toSession->id) {
                throw ValidationException::withMessages([
                    'to_academic_session_id' => ['A promoted or repeated student must move to a different academic session.'],
                ]);
            }

            $this->assertPlacement(
                $schoolId,
                (int) $data['from_division_id'],
                (int) $data['from_class_id'],
                $data['from_stream_id'] ?? null,
                'from'
            );
            $this->assertPlacement(
                $schoolId,
                (int) $data['to_division_id'],
                (int) $data['to_class_id'],
                $data['to_stream_id'] ?? null,
                'to'
            );

            $sourceEnrollments = StudentEnrollment::query()
                ->where('school_id', $schoolId)
                ->where('student_id', $student->id)
                ->where('academic_session_id', $fromSession->id)
                ->whereIn('status', ['Active', 'Promoted', 'Repeated'])
                ->lockForUpdate()
                ->get();

            if ($sourceEnrollments->isEmpty()) {
                throw ValidationException::withMessages([
                    'from_academic_session_id' => ['The student has no active enrollment in the selected source session.'],
                ]);
            }

            $matchingSource = $sourceEnrollments->first(fn (StudentEnrollment $enrollment): bool =>
                (int) $enrollment->division_id === (int) $data['from_division_id']
                && (int) $enrollment->class_id === (int) $data['from_class_id']
                && (int) ($enrollment->stream_id ?? 0) === (int) ($data['from_stream_id'] ?? 0)
            );

            if (! $matchingSource) {
                throw ValidationException::withMessages([
                    'from_class_id' => ['The selected source placement does not match this student’s enrollment in the source session.'],
                ]);
            }

            $existingPromotion = StudentPromotion::query()
                ->where('school_id', $schoolId)
                ->where('student_id', $student->id)
                ->where('to_academic_session_id', $toSession->id)
                ->lockForUpdate()
                ->first();

            if ($existingPromotion) {
                throw ValidationException::withMessages([
                    'student_id' => ['A lifecycle decision for this student and target session already exists.'],
                ]);
            }

            $promotion = StudentPromotion::create([
                'school_id' => $schoolId,
                'student_id' => $student->id,
                'from_academic_session_id' => $fromSession->id,
                'to_academic_session_id' => $toSession->id,
                'from_division_id' => $data['from_division_id'],
                'to_division_id' => $data['to_division_id'],
                'from_class_id' => $data['from_class_id'],
                'to_class_id' => $data['to_class_id'],
                'from_stream_id' => $data['from_stream_id'] ?? null,
                'to_stream_id' => $data['to_stream_id'] ?? null,
                'promotion_date' => $data['promotion_date'],
                'promotion_status' => $status,
                'remarks' => $data['remarks'] ?? null,
            ]);

            $targetEnrollments = collect();
            $graduation = null;

            if (in_array($status, ['Promoted', 'Repeated'], true)) {
                $terms = Term::query()
                    ->where('academic_session_id', $toSession->id)
                    ->orderBy('start_date')
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                if ($terms->isEmpty()) {
                    throw ValidationException::withMessages([
                        'to_academic_session_id' => ['The target academic session has no terms. Create its terms before promoting or repeating a student.'],
                    ]);
                }

                $existingTarget = StudentEnrollment::query()
                    ->where('school_id', $schoolId)
                    ->where('student_id', $student->id)
                    ->where('academic_session_id', $toSession->id)
                    ->lockForUpdate()
                    ->exists();

                if ($existingTarget) {
                    throw ValidationException::withMessages([
                        'to_academic_session_id' => ['The student already has an enrollment in the target session.'],
                    ]);
                }

                foreach ($terms as $term) {
                    $targetEnrollments->push(StudentEnrollment::create([
                        'school_id' => $schoolId,
                        'student_id' => $student->id,
                        'academic_session_id' => $toSession->id,
                        'term_id' => $term->id,
                        'division_id' => $data['to_division_id'],
                        'class_id' => $data['to_class_id'],
                        'stream_id' => $data['to_stream_id'] ?? null,
                        'enrollment_date' => $data['promotion_date'],
                        'status' => 'Active',
                    ]));
                }

                $sourceEnrollments->each->update(['status' => $status]);

                if ($toSession->is_current) {
                    $student->update([
                        'division_id' => $data['to_division_id'],
                        'class_id' => $data['to_class_id'],
                        'stream_id' => $data['to_stream_id'] ?? null,
                        'academic_session_id' => $toSession->id,
                        'status' => 'Active',
                    ]);
                }
            } elseif ($status === 'Transferred') {
                $sourceEnrollments->each->update(['status' => 'Transferred']);
                $student->update(['status' => 'Transferred']);
            } elseif ($status === 'Graduated') {
                $laterActiveEnrollment = StudentEnrollment::query()
                    ->where('school_id', $schoolId)
                    ->where('student_id', $student->id)
                    ->where('status', 'Active')
                    ->where('academic_session_id', '!=', $fromSession->id)
                    ->exists();

                if ($laterActiveEnrollment) {
                    throw ValidationException::withMessages([
                        'from_academic_session_id' => ['This student already has an active enrollment in another session. Close that lifecycle first.'],
                    ]);
                }

                $sourceEnrollments->each->update(['status' => 'Graduated']);
                $student->update(['status' => 'Graduated']);
                $graduation = GraduationRecord::create([
                    'school_id' => $schoolId,
                    'student_id' => $student->id,
                    'academic_session_id' => $fromSession->id,
                    'graduation_date' => $data['promotion_date'],
                    'status' => 'graduated',
                    'notes' => $data['remarks'] ?? null,
                    'created_by' => $actorId,
                ]);
            }

            return [
                'promotion' => $promotion->fresh()->load(['student', 'fromAcademicSession', 'toAcademicSession']),
                'student' => $student->fresh()->load(['class', 'stream', 'division', 'academicSession']),
                'target_enrollments' => $targetEnrollments->load(['term', 'academicSession', 'class', 'stream', 'division']),
                'graduation' => $graduation?->fresh()->load(['student', 'academicSession']),
            ];
        });
    }

    /**
     * Create or update a graduation register entry and apply terminal status
     * only for graduated/alumni decisions. Pending records do not deactivate a
     * student and may be completed later by an authorized school user.
     */
    public function syncCurrentPlacements(int $schoolId): int
    {
        $currentSession = AcademicSession::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        if (! $currentSession) {
            return 0;
        }

        $currentTerm = Term::query()
            ->where('academic_session_id', $currentSession->id)
            ->where('is_current', true)
            ->orderBy('start_date')
            ->orderBy('id')
            ->first();

        if (! $currentTerm) {
            return 0;
        }

        $enrollments = StudentEnrollment::query()
            ->where('school_id', $schoolId)
            ->where('academic_session_id', $currentSession->id)
            ->where('term_id', $currentTerm->id)
            ->where('status', 'Active')
            ->whereHas('student', fn ($query) => $query->where('status', 'Active'))
            ->with('student')
            ->get();

        foreach ($enrollments as $enrollment) {
            $enrollment->student?->update([
                'division_id' => $enrollment->division_id,
                'class_id' => $enrollment->class_id,
                'stream_id' => $enrollment->stream_id,
                'academic_session_id' => $currentSession->id,
                'status' => 'Active',
            ]);
        }

        return $enrollments->count();
    }

    public function recordGraduation(array $data, int $schoolId, ?int $actorId = null): GraduationRecord
    {
        return DB::transaction(function () use ($data, $schoolId, $actorId): GraduationRecord {
            $student = Student::query()
                ->whereKey((int) $data['student_id'])
                ->where('school_id', $schoolId)
                ->lockForUpdate()
                ->firstOrFail();
            $sessionId = ! empty($data['academic_session_id']) ? (int) $data['academic_session_id'] : null;
            if ($sessionId) {
                $this->schoolSession($sessionId, $schoolId);
            }

            $record = GraduationRecord::query()
                ->where('school_id', $schoolId)
                ->where('student_id', $student->id)
                ->when($sessionId, fn ($query) => $query->where('academic_session_id', $sessionId))
                ->when(! $sessionId, fn ($query) => $query->whereNull('academic_session_id'))
                ->lockForUpdate()
                ->first();

            if ($record && $record->status !== 'pending') {
                throw ValidationException::withMessages([
                    'student_id' => ['A completed graduation record already exists for this student and session.'],
                ]);
            }

            if (in_array($data['status'], ['graduated', 'alumni'], true)) {
                $activeElsewhere = StudentEnrollment::query()
                    ->where('school_id', $schoolId)
                    ->where('student_id', $student->id)
                    ->where('status', 'Active')
                    ->when($sessionId, fn ($query) => $query->where('academic_session_id', '!=', $sessionId))
                    ->exists();

                if ($activeElsewhere) {
                    throw ValidationException::withMessages([
                        'academic_session_id' => ['The student has another active enrollment. Select the final session or close the other enrollment first.'],
                    ]);
                }

                StudentEnrollment::query()
                    ->where('school_id', $schoolId)
                    ->where('student_id', $student->id)
                    ->whereIn('status', ['Active', 'Promoted', 'Repeated'])
                    ->update(['status' => 'Graduated']);
                $student->update(['status' => 'Graduated']);
            }

            if ($record) {
                $record->update([
                    'academic_session_id' => $sessionId,
                    'graduation_date' => $data['graduation_date'] ?? null,
                    'certificate_number' => $data['certificate_number'] ?? null,
                    'destination' => $data['destination'] ?? null,
                    'status' => $data['status'],
                    'notes' => $data['notes'] ?? null,
                ]);
            } else {
                $record = GraduationRecord::create([
                    'school_id' => $schoolId,
                    'student_id' => $student->id,
                    'academic_session_id' => $sessionId,
                    'graduation_date' => $data['graduation_date'] ?? null,
                    'certificate_number' => $data['certificate_number'] ?? null,
                    'destination' => $data['destination'] ?? null,
                    'status' => $data['status'],
                    'notes' => $data['notes'] ?? null,
                    'created_by' => $actorId,
                ]);
            }

            return $record->fresh()->load(['student', 'academicSession']);
        });
    }

    public function updateGraduation(GraduationRecord $record, array $data, int $schoolId): GraduationRecord
    {
        return DB::transaction(function () use ($record, $data, $schoolId): GraduationRecord {
            $locked = GraduationRecord::query()
                ->whereKey($record->id)
                ->where('school_id', $schoolId)
                ->lockForUpdate()
                ->firstOrFail();

            if (array_key_exists('status', $data) && $data['status'] !== $locked->status && $locked->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => ['A completed graduation record cannot be downgraded. Use an authorized lifecycle-reversal process instead.'],
                ]);
            }

            if (($data['status'] ?? $locked->status) === 'pending' && $locked->status === 'pending') {
                $locked->update($data);
                return $locked->fresh()->load(['student', 'academicSession']);
            }

            $locked->update($data);
            if (in_array($locked->status, ['graduated', 'alumni'], true)) {
                StudentEnrollment::query()
                    ->where('school_id', $schoolId)
                    ->where('student_id', $locked->student_id)
                    ->whereIn('status', ['Active', 'Promoted', 'Repeated'])
                    ->update(['status' => 'Graduated']);
                Student::query()->whereKey($locked->student_id)->where('school_id', $schoolId)->update(['status' => 'Graduated']);
            }

            return $locked->fresh()->load(['student', 'academicSession']);
        });
    }

    private function schoolSession(int|string $sessionId, int $schoolId): AcademicSession
    {
        return AcademicSession::query()
            ->whereKey((int) $sessionId)
            ->where('school_id', $schoolId)
            ->firstOrFail();
    }

    private function assertPlacement(int $schoolId, int $divisionId, int $classId, int|string|null $streamId, string $prefix): void
    {
        abort_unless(
            Division::query()->whereKey($divisionId)->where('school_id', $schoolId)->exists(),
            422,
            "The selected {$prefix} division does not belong to the current school."
        );
        abort_unless(
            ClassModel::query()->whereKey($classId)->where('division_id', $divisionId)->exists(),
            422,
            "The selected {$prefix} class does not belong to the selected division."
        );
        if ($streamId !== null && $streamId !== '') {
            abort_unless(
                Stream::query()->whereKey((int) $streamId)->where('class_id', $classId)->exists(),
                422,
                "The selected {$prefix} stream does not belong to the selected class."
            );
        }
    }
}

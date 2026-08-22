<?php

namespace App\Http\Requests;

use App\Models\ClassModel;
use App\Models\Stream;
use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTimetableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = $this->user()
            ? app(CurrentContextService::class)->currentSchool($this->user())?->id
            : null;
        $existing = $this->route('timetable');
        $entryType = (string) $this->input('entry_type', $existing?->entry_type ?? 'lesson');
        $scheduleMode = (string) $this->input('schedule_mode', $existing?->schedule_mode ?? 'weekly');
        $targetType = (string) $this->input('target_type', $existing?->target_type ?? 'class');
        $schoolScoped = fn (string $table) => Rule::exists($table, 'id')->where(fn ($query) => $query->where('school_id', $schoolId));
        $schoolClassIds = ClassModel::query()->whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->select('id');
        $schoolStreamIds = Stream::query()->whereHas('class.division', fn ($query) => $query->where('school_id', $schoolId))->select('id');

        return [
            'entry_type' => ['sometimes', 'string', Rule::in(['lesson', 'break', 'assembly', 'event', 'holiday', 'meeting', 'other'])],
            'schedule_mode' => ['sometimes', 'string', Rule::in(['weekly', 'single_date', 'date_range'])],
            'target_type' => ['sometimes', 'string', Rule::in(['class', 'division', 'school'])],
            'title' => [$entryType === 'lesson' ? 'sometimes' : 'required', 'nullable', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'academic_session_id' => ['sometimes', 'required', $schoolScoped('academic_sessions')],
            'term_id' => ['sometimes', 'required', $schoolScoped('terms')],
            'division_id' => [$targetType === 'division' || $targetType === 'class' ? 'sometimes' : 'nullable', 'nullable', 'integer', $schoolScoped('divisions')],
            'class_id' => [$targetType === 'class' ? 'sometimes' : 'nullable', 'nullable', 'integer', Rule::exists('classes', 'id')->whereIn('id', $schoolClassIds)],
            'stream_id' => ['sometimes', 'nullable', 'integer', Rule::exists('streams', 'id')->whereIn('id', $schoolStreamIds)],
            'subject_id' => [$entryType === 'lesson' ? 'sometimes' : 'nullable', 'nullable', 'integer', $schoolScoped('subjects')],
            'staff_id' => ['sometimes', 'nullable', 'integer', $schoolScoped('staff')],
            'day_of_week' => [$scheduleMode === 'weekly' ? 'sometimes' : 'nullable', Rule::in(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])],
            'start_time' => [$scheduleMode === 'weekly' || $scheduleMode === 'single_date' ? 'sometimes' : 'nullable', 'date_format:H:i'],
            'end_time' => [$scheduleMode === 'weekly' || $scheduleMode === 'single_date' ? 'sometimes' : 'nullable', 'date_format:H:i', 'after:start_time'],
            'event_date' => [$scheduleMode === 'single_date' ? 'sometimes' : 'nullable', 'date'],
            'effective_from' => [$scheduleMode === 'date_range' ? 'sometimes' : 'nullable', 'date', 'before_or_equal:effective_until'],
            'effective_until' => [$scheduleMode === 'date_range' ? 'sometimes' : 'nullable', 'date', 'after_or_equal:effective_from'],
            'room' => ['sometimes', 'nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

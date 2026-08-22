<?php

namespace App\Http\Requests;

use App\Models\ClassModel;
use App\Models\Stream;
use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTimetableRequest extends FormRequest
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

        $schoolScoped = fn (string $table) => Rule::exists($table, 'id')->where(fn ($query) => $query->where('school_id', $schoolId));
        $schoolClassIds = ClassModel::query()->whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->select('id');
        $schoolStreamIds = Stream::query()->whereHas('class.division', fn ($query) => $query->where('school_id', $schoolId))->select('id');
        $entryType = (string) $this->input('entry_type', 'lesson');
        $scheduleMode = (string) $this->input('schedule_mode', 'weekly');
        $targetType = (string) $this->input('target_type', 'class');

        return [
            'entry_type' => ['sometimes', 'string', Rule::in(['lesson', 'break', 'assembly', 'event', 'holiday', 'meeting', 'other'])],
            'schedule_mode' => ['sometimes', 'string', Rule::in(['weekly', 'single_date', 'date_range'])],
            'target_type' => ['sometimes', 'string', Rule::in(['class', 'division', 'school'])],
            'title' => [$entryType === 'lesson' ? 'nullable' : 'required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],

            'academic_session_id' => ['required', $schoolScoped('academic_sessions')],
            'term_id' => ['required', $schoolScoped('terms')],
            'division_id' => [$targetType === 'division' || $targetType === 'class' ? 'required' : 'nullable', 'integer', $schoolScoped('divisions')],
            'class_id' => [$targetType === 'class' ? 'required' : 'nullable', 'integer', Rule::exists('classes', 'id')->whereIn('id', $schoolClassIds)],
            'stream_id' => ['nullable', 'integer', Rule::exists('streams', 'id')->whereIn('id', $schoolStreamIds)],
            'subject_id' => [$entryType === 'lesson' ? 'required' : 'nullable', 'integer', $schoolScoped('subjects')],
            'staff_id' => [$entryType === 'lesson' ? 'nullable' : 'nullable', 'integer', $schoolScoped('staff')],

            'day_of_week' => [$scheduleMode === 'weekly' ? 'required' : 'nullable', Rule::in(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])],
            'start_time' => [$scheduleMode === 'weekly' || $scheduleMode === 'single_date' ? 'required' : 'nullable', 'date_format:H:i'],
            'end_time' => [$scheduleMode === 'weekly' || $scheduleMode === 'single_date' ? 'required' : 'nullable', 'date_format:H:i', 'after:start_time'],
            'event_date' => [$scheduleMode === 'single_date' ? 'required' : 'nullable', 'date'],
            'effective_from' => [$scheduleMode === 'date_range' ? 'required' : 'nullable', 'date', 'before_or_equal:effective_until'],
            'effective_until' => [$scheduleMode === 'date_range' ? 'required' : 'nullable', 'date', 'after_or_equal:effective_from'],
            'room' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'academic_session_id.exists' => 'Selected academic session does not belong to the active school.',
            'term_id.exists' => 'Selected term does not belong to the active school.',
            'division_id.exists' => 'Selected division does not belong to the active school.',
            'class_id.exists' => 'Selected class does not belong to the active school.',
            'stream_id.exists' => 'Selected stream does not belong to the active school.',
            'subject_id.exists' => 'Selected subject does not belong to the active school.',
            'staff_id.exists' => 'Selected staff member does not belong to the active school.',
            'title.required' => 'A title is required for non-lesson schedule entries.',
            'end_time.after' => 'End time must be after start time.',
        ];
    }
}

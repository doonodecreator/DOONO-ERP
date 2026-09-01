<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class MedicalRecordController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    private function healthSchoolId(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'Select an active school before managing health records.');
        return (int) $schoolId;
    }

    private function scoped(Request $request, MedicalRecord $record): MedicalRecord
    {
        abort_unless((int) $record->school_id === $this->healthSchoolId($request), 404, 'Medical record not found.');
        return $record;
    }

    private function canViewSensitive(Request $request, int $schoolId): bool
    {
        return $request->user()->hasPermission('view_sensitive_health', $schoolId);
    }

    private function present(MedicalRecord $record, bool $sensitive): array
    {
        $record->loadMissing('student:id,school_id,first_name,last_name,surname,admission_number');
        if ($sensitive) {
            return $record->toArray();
        }
        return [
            'id' => $record->id,
            'school_id' => $record->school_id,
            'student' => $record->student,
            'created_at' => $record->created_at,
            'updated_at' => $record->updated_at,
            'has_allergies' => filled($record->allergies),
            'has_chronic_conditions' => filled($record->chronic_conditions),
            'has_emergency_contact' => filled($record->emergency_contact_name) || filled($record->emergency_contact_phone),
            'sensitivity' => 'summary',
        ];
    }

    public function index(Request $request)
    {
        $schoolId = $this->healthSchoolId($request);
        $sensitive = $this->canViewSensitive($request, $schoolId);
        $paginator = MedicalRecord::query()->where('school_id', $schoolId)->with(['student:id,school_id,first_name,last_name,surname,admission_number'])->latest()->paginate(min(max($request->integer('per_page', 10), 1), 100));
        $paginator->getCollection()->transform(fn (MedicalRecord $record) => $this->present($record, $sensitive));
        ActivityLogService::log('health', 'medical_records_listed', 'Medical profiles were listed with the viewer’s permitted disclosure level.', null, ['sensitive' => $sensitive], $schoolId);
        return response()->json($paginator);
    }

    public function store(Request $request)
    {
        $schoolId = $this->healthSchoolId($request);
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'genotype' => ['nullable', 'string', 'max:10'],
            'allergies' => ['nullable', 'string', 'max:5000'],
            'chronic_conditions' => ['nullable', 'string', 'max:5000'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
        ]);
        $student = Student::query()->whereKey($validated['student_id'])->where('school_id', $schoolId)->firstOrFail();
        abort_if(MedicalRecord::where('school_id', $schoolId)->where('student_id', $student->id)->exists(), 422, 'This student already has a medical profile. Update the existing record instead.');
        $record = MedicalRecord::create([...$validated, 'school_id' => $schoolId]);
        ActivityLogService::log('health', 'medical_record_created', 'A student medical profile was created.', $record, ['student_id' => $student->id], $schoolId);
        return response()->json(['message' => 'Medical record saved successfully.', 'data' => $this->present($record, true)], 201);
    }

    public function show(Request $request, MedicalRecord $medicalRecord)
    {
        $record = $this->scoped($request, $medicalRecord);
        $sensitive = $this->canViewSensitive($request, (int) $record->school_id);
        ActivityLogService::log('health', 'medical_record_viewed', 'A student medical profile was viewed with the permitted disclosure level.', $record, ['student_id' => $record->student_id, 'sensitive' => $sensitive], (int) $record->school_id);
        return response()->json($this->present($record, $sensitive));
    }

    public function update(Request $request, MedicalRecord $medicalRecord)
    {
        $record = $this->scoped($request, $medicalRecord);
        $validated = $request->validate([
            'blood_group' => ['nullable', 'string', 'max:10'],
            'genotype' => ['nullable', 'string', 'max:10'],
            'allergies' => ['nullable', 'string', 'max:5000'],
            'chronic_conditions' => ['nullable', 'string', 'max:5000'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
        ]);
        $before = $record->only(['blood_group', 'genotype', 'allergies', 'chronic_conditions', 'emergency_contact_name', 'emergency_contact_phone']);
        $record->update($validated);
        ActivityLogService::log('health', 'medical_record_updated', 'A student medical profile was updated.', $record, ['before' => $before, 'after' => $record->fresh()->only(array_keys($before))], (int) $record->school_id);
        return response()->json(['message' => 'Medical record updated successfully.', 'data' => $this->present($record->fresh(), true)]);
    }

    public function destroy(Request $request, MedicalRecord $medicalRecord)
    {
        $this->scoped($request, $medicalRecord);
        return response()->json(['message' => 'Medical history is retained for safety and accountability. Update the profile instead of deleting it.'], 422);
    }
}

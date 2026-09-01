<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicVisit;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class ClinicVisitController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    private function healthSchoolId(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'Select an active school before managing clinic visits.');
        return (int) $schoolId;
    }

    private function scoped(Request $request, ClinicVisit $visit): ClinicVisit
    {
        abort_unless((int) $visit->school_id === $this->healthSchoolId($request), 404, 'Clinic visit not found.');
        return $visit;
    }

    private function canViewSensitive(Request $request, int $schoolId): bool
    {
        return $request->user()->hasPermission('view_sensitive_health', $schoolId);
    }

    private function present(ClinicVisit $visit, bool $sensitive): array
    {
        $visit->loadMissing(['student:id,school_id,first_name,last_name,surname,admission_number', 'treatedBy:id,name', 'updatedBy:id,name']);
        if ($sensitive) {
            return $visit->toArray();
        }
        return [
            'id' => $visit->id,
            'school_id' => $visit->school_id,
            'student' => $visit->student,
            'visit_date' => $visit->visit_date,
            'referral_status' => $visit->referral_status,
            'follow_up_date' => $visit->follow_up_date,
            'emergency_flag' => (bool) $visit->emergency_flag,
            'sensitivity' => 'summary',
            'created_at' => $visit->created_at,
            'updated_at' => $visit->updated_at,
        ];
    }

    public function index(Request $request)
    {
        $schoolId = $this->healthSchoolId($request);
        $sensitive = $this->canViewSensitive($request, $schoolId);
        $paginator = ClinicVisit::query()->where('school_id', $schoolId)->with(['student:id,school_id,first_name,last_name,surname,admission_number', 'treatedBy:id,name'])->latest('visit_date')->paginate(min(max($request->integer('per_page', 10), 1), 100));
        $paginator->getCollection()->transform(fn (ClinicVisit $visit) => $this->present($visit, $sensitive));
        ActivityLogService::log('health', 'clinic_visits_listed', 'Clinic visits were listed with the viewer’s permitted disclosure level.', null, ['sensitive' => $sensitive], $schoolId);
        return response()->json($paginator);
    }

    public function store(Request $request)
    {
        $schoolId = $this->healthSchoolId($request);
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'visit_date' => ['required', 'date'],
            'complaint' => ['required', 'string', 'max:5000'],
            'treatment_given' => ['required', 'string', 'max:5000'],
            'nurse_notes' => ['nullable', 'string', 'max:5000'],
            'referral_status' => ['nullable', 'in:none,pending,completed,declined'],
            'referral_destination' => ['nullable', 'string', 'max:255'],
            'follow_up_date' => ['nullable', 'date'],
            'emergency_flag' => ['sometimes', 'boolean'],
        ]);
        $student = Student::query()->whereKey($validated['student_id'])->where('school_id', $schoolId)->firstOrFail();
        if (($validated['referral_status'] ?? 'none') !== 'none') abort_unless(! empty($validated['referral_destination']), 422, 'A referral destination is required when a referral is recorded.');
        $visit = ClinicVisit::create([...$validated, 'school_id' => $schoolId, 'treated_by' => $request->user()->id, 'referral_status' => $validated['referral_status'] ?? 'none', 'emergency_flag' => (bool) ($validated['emergency_flag'] ?? false)]);
        ActivityLogService::log('health', 'clinic_visit_created', 'A clinic visit was recorded.', $visit, ['student_id' => $student->id, 'emergency_flag' => (bool) $visit->emergency_flag, 'referral_status' => $visit->referral_status], $schoolId);
        return response()->json(['message' => 'Clinic visit logged successfully.', 'data' => $this->present($visit, true)], 201);
    }

    public function show(Request $request, ClinicVisit $clinicVisit)
    {
        $visit = $this->scoped($request, $clinicVisit);
        $sensitive = $this->canViewSensitive($request, (int) $visit->school_id);
        ActivityLogService::log('health', 'clinic_visit_viewed', 'A clinic visit was viewed with the permitted disclosure level.', $visit, ['student_id' => $visit->student_id, 'sensitive' => $sensitive], (int) $visit->school_id);
        return response()->json($this->present($visit, $sensitive));
    }

    public function update(Request $request, ClinicVisit $clinicVisit)
    {
        $visit = $this->scoped($request, $clinicVisit);
        $validated = $request->validate([
            'visit_date' => ['sometimes', 'date'],
            'complaint' => ['sometimes', 'string', 'max:5000'],
            'treatment_given' => ['sometimes', 'string', 'max:5000'],
            'nurse_notes' => ['nullable', 'string', 'max:5000'],
            'referral_status' => ['sometimes', 'in:none,pending,completed,declined'],
            'referral_destination' => ['nullable', 'string', 'max:255'],
            'follow_up_date' => ['nullable', 'date'],
            'emergency_flag' => ['sometimes', 'boolean'],
        ]);
        $nextReferral = $validated['referral_status'] ?? $visit->referral_status ?? 'none';
        if ($nextReferral !== 'none') abort_unless(array_key_exists('referral_destination', $validated) ? $validated['referral_destination'] : $visit->referral_destination, 422, 'A referral destination is required when a referral is recorded.');
        $before = $visit->only(['visit_date', 'complaint', 'treatment_given', 'nurse_notes', 'referral_status', 'referral_destination', 'follow_up_date', 'emergency_flag']);
        $visit->update([...$validated, 'updated_by' => $request->user()->id]);
        ActivityLogService::log('health', 'clinic_visit_updated', 'A clinic visit was updated.', $visit, ['before' => $before, 'after' => $visit->fresh()->only(array_keys($before))], (int) $visit->school_id);
        return response()->json(['message' => 'Clinic visit updated successfully.', 'data' => $this->present($visit->fresh(), true)]);
    }

    public function destroy(Request $request, ClinicVisit $clinicVisit)
    {
        $this->scoped($request, $clinicVisit);
        return response()->json(['message' => 'Clinic history is retained for safety and accountability. Update the visit instead of deleting it.'], 422);
    }
}

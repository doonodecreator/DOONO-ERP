<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssessmentActivity;
use App\Models\AcademicSession;
use App\Models\ClassModel;
use App\Models\Division;
use App\Models\Subject;
use App\Models\Term;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssessmentActivityController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $query = AssessmentActivity::with(['academicSession:id,name', 'term:id,name', 'division:id,name', 'class:id,name', 'subject:id,name'])
            ->where('school_id', $schoolId)
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->input('type')))
            ->latest('scheduled_date')->latest('id');

        return response()->json($query->paginate(min(max($request->integer('per_page', 25), 1), 100)));
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $this->validateData($request);
        $this->assertReferencesBelongToSchool($data, $schoolId);
        $activity = AssessmentActivity::create([...$data, 'school_id' => $schoolId, 'created_by' => $request->user()->id]);

        ActivityLogService::log(module: 'assessment_activities', action: 'created', description: "{$activity->type} assessment activity created.", subject: $activity, schoolId: $schoolId);
        return response()->json(['data' => $activity->load(['academicSession:id,name', 'term:id,name', 'division:id,name', 'class:id,name', 'subject:id,name'])], 201);
    }

    public function update(Request $request, AssessmentActivity $assessmentActivity)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $assessmentActivity->school_id === $schoolId, 404);
        $data = $this->validateData($request, true);
        $this->assertReferencesBelongToSchool($data, $schoolId);
        $assessmentActivity->update($data);
        ActivityLogService::log(module: 'assessment_activities', action: 'updated', description: "{$assessmentActivity->type} assessment activity updated.", subject: $assessmentActivity, schoolId: $schoolId);
        return response()->json(['data' => $assessmentActivity->fresh()->load(['academicSession:id,name', 'term:id,name', 'division:id,name', 'class:id,name', 'subject:id,name'])]);
    }

    public function destroy(Request $request, AssessmentActivity $assessmentActivity)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $assessmentActivity->school_id === $schoolId, 404);
        $assessmentActivity->delete();
        ActivityLogService::log(module: 'assessment_activities', action: 'deleted', description: 'Assessment activity deleted.', schoolId: $schoolId, properties: ['activity_id' => $assessmentActivity->id]);
        return response()->json(['message' => 'Assessment activity deleted successfully.']);
    }

    private function validateData(Request $request, bool $update = false): array
    {
        $required = $update ? 'sometimes' : 'required';
        return $request->validate([
            'type' => [$required, Rule::in(['external_exam', 'practical'])],
            'name' => [$required, 'string', 'max:180'],
            'exam_body' => ['nullable', 'string', 'max:120'],
            'academic_session_id' => ['nullable', 'integer', 'exists:academic_sessions,id'],
            'term_id' => ['nullable', 'integer', 'exists:terms,id'],
            'division_id' => ['nullable', 'integer', 'exists:divisions,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'scheduled_date' => ['nullable', 'date'],
            'candidate_count' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['Planned', 'In Progress', 'Completed', 'Cancelled'])],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }

    private function assertReferencesBelongToSchool(array $data, int $schoolId): void
    {
        if (!empty($data['academic_session_id'])) {
            abort_unless(AcademicSession::whereKey($data['academic_session_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected academic_session_id does not belong to the active school.');
        }
        if (!empty($data['term_id'])) {
            abort_unless(Term::whereKey($data['term_id'])->whereHas('academicSession', fn ($query) => $query->where('school_id', $schoolId))->exists(), 422, 'The selected term_id does not belong to the active school.');
        }
        if (!empty($data['division_id'])) {
            abort_unless(Division::whereKey($data['division_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected division_id does not belong to the active school.');
        }
        if (!empty($data['class_id'])) {
            abort_unless(ClassModel::whereKey($data['class_id'])->whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->exists(), 422, 'The selected class_id does not belong to the active school.');
        }
        if (!empty($data['subject_id'])) {
            abort_unless(Subject::whereKey($data['subject_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected subject_id does not belong to the active school.');
        }
    }
}

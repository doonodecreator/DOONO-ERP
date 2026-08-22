<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CbtQuestion;
use App\Models\CbtAssessmentQuestion;
use App\Models\Examination;
use App\Models\Subject;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CbtQuestionController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $query = CbtQuestion::where('school_id', $schoolId)
            ->with(['examination:id,name', 'subject:id,name', 'creator:id,name'])
            ->when($request->filled('examination_id'), fn ($query) => $query->where('examination_id', $request->integer('examination_id')))
            ->when($request->filled('subject_id'), fn ($query) => $query->where('subject_id', $request->integer('subject_id')))
            ->when($request->filled('section'), fn ($query) => $query->where('section', $request->input('section')))
            ->when($request->filled('topic'), fn ($query) => $query->where('topic', 'like', '%'.$request->input('topic').'%'))
            ->when($request->filled('difficulty'), fn ($query) => $query->where('difficulty', $request->input('difficulty')))
            ->orderBy('section')
            ->orderBy('question_order')
            ->latest('id');

        return response()->json($query->paginate(min(max($request->integer('per_page', 25), 1), 500)));
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'examination_id' => ['nullable', 'integer', 'exists:examinations,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'section' => ['nullable', 'string', 'max:120'],
            'topic' => ['nullable', 'string', 'max:180'],
            'difficulty' => ['sometimes', 'in:easy,medium,hard'],
            'question_order' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'question' => ['required', 'string', 'max:10000'],
            'options' => ['required', 'array', 'min:2', 'max:8'],
            'options.*' => ['required', 'string', 'max:500'],
            'correct_answer' => ['required', 'string', 'max:255'],
            'marks' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $this->assertQuestionReferences($schoolId, $data);
        abort_unless(in_array($data['correct_answer'], $data['options'], true), 422, 'The correct answer must match one of the supplied options.');

        $question = CbtQuestion::create([
            ...$data,
            'school_id' => $schoolId,
            'created_by' => $request->user()->id,
        ]);

        ActivityLogService::log(
            module: 'cbt',
            action: 'question_created',
            description: 'A CBT question was added to the school question bank.',
            subject: $question,
            schoolId: $schoolId,
        );

        return response()->json(['data' => $question->load(['examination:id,name', 'subject:id,name', 'creator:id,name'])], 201);
    }

    public function bulkStore(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'examination_id' => ['nullable', 'integer', 'exists:examinations,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'section' => ['nullable', 'string', 'max:120'],
            'topic' => ['nullable', 'string', 'max:180'],
            'difficulty' => ['sometimes', 'in:easy,medium,hard'],
            'marks' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'questions' => ['required', 'array', 'min:1', 'max:500'],
            'questions.*.question' => ['required', 'string', 'max:10000'],
            'questions.*.options' => ['required', 'array', 'min:2', 'max:8'],
            'questions.*.options.*' => ['required', 'string', 'max:500'],
            'questions.*.correct_answer' => ['required', 'string', 'max:255'],
            'questions.*.marks' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'questions.*.question_order' => ['sometimes', 'integer', 'min:1', 'max:10000'],
        ]);

        $this->assertQuestionReferences($schoolId, $data);
        $batchKey = (string) Str::uuid();
        $questions = DB::transaction(function () use ($data, $schoolId, $request, $batchKey) {
            return collect($data['questions'])->values()->map(function (array $row, int $index) use ($data, $schoolId, $request, $batchKey) {
                $options = array_values(array_filter($row['options'], fn ($option) => trim((string) $option) !== ''));
                abort_unless(in_array($row['correct_answer'], $options, true), 422, 'Every correct answer must match one of its options.');
                return CbtQuestion::create([
                    'school_id' => $schoolId,
                    'examination_id' => $data['examination_id'] ?? null,
                    'subject_id' => $data['subject_id'] ?? null,
                    'section' => $data['section'] ?? null,
                    'topic' => $data['topic'] ?? null,
                    'difficulty' => $data['difficulty'] ?? 'medium',
                    'created_by' => $request->user()->id,
                    'question' => $row['question'],
                    'options' => $options,
                    'correct_answer' => $row['correct_answer'],
                    'marks' => $row['marks'] ?? ($data['marks'] ?? 1),
                    'question_order' => $row['question_order'] ?? ($index + 1),
                    'batch_key' => $batchKey,
                    'is_active' => true,
                ]);
            });
        });

        ActivityLogService::log(module: 'cbt', action: 'questions_bulk_created', description: "{$questions->count()} CBT questions were added to the school question bank in one batch.", schoolId: $schoolId, properties: ['batch_key' => $batchKey, 'count' => $questions->count()]);
        return response()->json(['message' => "{$questions->count()} questions added to the CBT bank.", 'batch_key' => $batchKey, 'created_count' => $questions->count()], 201);
    }

    public function update(Request $request, CbtQuestion $cbtQuestion)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $cbtQuestion->school_id === $schoolId, 404);

        $data = $request->validate([
            'examination_id' => ['nullable', 'integer', 'exists:examinations,id'],
            'subject_id' => ['sometimes', 'nullable', 'integer', 'exists:subjects,id'],
            'section' => ['sometimes', 'nullable', 'string', 'max:120'],
            'topic' => ['sometimes', 'nullable', 'string', 'max:180'],
            'difficulty' => ['sometimes', 'in:easy,medium,hard'],
            'question_order' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'question' => ['sometimes', 'required', 'string', 'max:10000'],
            'options' => ['sometimes', 'required', 'array', 'min:2', 'max:8'],
            'options.*' => ['required', 'string', 'max:500'],
            'correct_answer' => ['sometimes', 'required', 'string', 'max:255'],
            'marks' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $options = $data['options'] ?? $cbtQuestion->options;
        $correct = $data['correct_answer'] ?? $cbtQuestion->correct_answer;
        abort_unless(in_array($correct, $options, true), 422, 'The correct answer must match one of the supplied options.');

        $this->assertQuestionReferences($schoolId, $data);
        $cbtQuestion->update($data);
        ActivityLogService::log(module: 'cbt', action: 'question_updated', description: 'A CBT question was updated.', subject: $cbtQuestion, schoolId: $schoolId);

        return response()->json(['data' => $cbtQuestion->fresh()->load(['examination:id,name', 'subject:id,name', 'creator:id,name'])]);
    }

    public function review(Request $request, CbtQuestion $cbtQuestion)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $cbtQuestion->school_id === $schoolId, 404);
        abort_unless($this->isQuestionReviewer($request, $schoolId), 403, 'Only academic leadership can approve CBT questions.');
        $data = $request->validate([
            'approval_status' => ['required', 'in:approved,rejected,draft'],
            'review_note' => ['nullable', 'string', 'max:1000'],
        ]);
        $cbtQuestion->update([
            'approval_status' => $data['approval_status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_note' => $data['review_note'] ?? null,
        ]);
        ActivityLogService::log(module: 'cbt', action: 'question_reviewed', description: 'A CBT question approval state was changed.', subject: $cbtQuestion, schoolId: $schoolId, properties: ['approval_status' => $data['approval_status']]);
        return response()->json(['data' => $cbtQuestion->fresh()->load(['examination:id,name', 'creator:id,name']), 'message' => 'Question review state saved.']);
    }

    public function destroy(Request $request, CbtQuestion $cbtQuestion)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $cbtQuestion->school_id === $schoolId, 404);
        abort_unless(!CbtAssessmentQuestion::where('cbt_question_id', $cbtQuestion->id)->exists(), 409, 'This question is already used in an assessment and cannot be deleted. Deactivate it instead.');
        $cbtQuestion->delete();

        ActivityLogService::log(module: 'cbt', action: 'question_deleted', description: 'A CBT question was deleted.', schoolId: $schoolId, properties: ['question_id' => $cbtQuestion->id]);

        return response()->json(['message' => 'CBT question deleted successfully.']);
    }

    private function assertQuestionReferences(int $schoolId, array $data): void
    {
        if (! empty($data['examination_id'])) {
            abort_unless(Examination::whereKey($data['examination_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected examination does not belong to the active school.');
        }
        if (array_key_exists('subject_id', $data) && $data['subject_id'] !== null) {
            abort_unless(Subject::whereKey($data['subject_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected subject does not belong to the active school.');
        }
    }

    private function isQuestionReviewer(Request $request, int $schoolId): bool
    {
        return collect(['proprietor', 'principal', 'vice_principal_academic', 'primary_headmaster', 'secondary_principal'])
            ->contains(fn (string $role) => $request->user()->hasRole($role, $schoolId));
    }

    public function studentQuestions(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $questions = CbtQuestion::where('school_id', $schoolId)
            ->where('is_active', true)
            ->where('approval_status', 'approved')
            ->when($request->filled('examination_id'), fn ($query) => $query->where('examination_id', $request->integer('examination_id')))
            ->when($request->filled('subject_id'), fn ($query) => $query->where('subject_id', $request->integer('subject_id')))
            ->orderBy('section')
            ->orderBy('question_order')
            ->get(['id', 'examination_id', 'subject_id', 'section', 'topic', 'difficulty', 'question', 'options', 'marks', 'question_order']);

        return response()->json(['data' => $questions]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Services\ActivityLogService;
use App\Services\AiTutorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AiTutorController extends Controller
{
    public function __construct(private AiTutorService $tutor) {}

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        return response()->json([
            'configured' => $this->tutor->configured(),
            'data' => AiConversation::query()
                ->where('school_id', $schoolId)
                ->where('user_id', $request->user()->id)
                ->where('status', 'active')
                ->latest()
                ->limit(20)
                ->get(['id', 'title', 'student_id', 'status', 'created_at', 'updated_at']),
        ]);
    }

    public function show(Request $request, AiConversation $conversation)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $conversation->school_id === $schoolId && (int) $conversation->user_id === (int) $request->user()->id, 404, 'AI conversation not found.');

        return response()->json([
            'configured' => $this->tutor->configured(),
            'data' => $conversation->load(['messages:id,ai_conversation_id,user_id,role,content,model,created_at']),
        ]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless($this->tutor->configured(), 503, 'The AI tutor is not configured for this deployment yet.');

        $validated = $request->validate([
            'conversation_id' => ['nullable', 'integer', 'exists:ai_conversations,id'],
            'message' => ['required', 'string', 'min:2', 'max:4000'],
        ]);

        $user = $request->user();
        $student = Student::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->whereRaw('LOWER(status) = ?', ['active'])
            ->first();
        if ($student) {
            abort_unless(StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists(), 403, 'The AI tutor is available only for an actively enrolled student.');
        }

        $conversation = $validated['conversation_id']
            ? AiConversation::query()->whereKey($validated['conversation_id'])->where('school_id', $schoolId)->where('user_id', $user->id)->where('status', 'active')->firstOrFail()
            : AiConversation::create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'student_id' => $student?->id,
                'title' => mb_substr($validated['message'], 0, 120),
                'status' => 'active',
            ]);

        $history = $conversation->messages()->latest('id')->limit(20)->get()->reverse()->map(fn (AiMessage $message) => [
            'role' => $message->role,
            'content' => $message->content,
        ])->values()->all();

        $userMessage = AiMessage::create([
            'school_id' => $schoolId,
            'ai_conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'role' => 'user',
            'content' => $validated['message'],
        ]);

        try {
            $answer = $this->tutor->answer([
                ['role' => 'system', 'content' => $this->tutor->systemPrompt(null, null, $student ? 'student' : 'staff')],
                ...$history,
                ['role' => 'user', 'content' => $validated['message']],
            ]);
        } catch (RuntimeException $exception) {
            $userMessage->delete();
            throw $exception;
        }

        $assistantMessage = DB::transaction(fn () => AiMessage::create([
            'school_id' => $schoolId,
            'ai_conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $answer['content'],
            'provider' => $answer['provider'],
            'model' => $answer['model'],
            'input_tokens' => $answer['input_tokens'],
            'output_tokens' => $answer['output_tokens'],
        ]));

        ActivityLogService::log('ai_tutor', 'message_sent', 'An AI tutor response was requested.', $conversation, ['conversation_id' => $conversation->id, 'student_context' => (bool) $student], $schoolId);

        return response()->json([
            'message' => 'AI tutor response generated.',
            'data' => [
                'conversation' => $conversation->fresh(['messages:id,ai_conversation_id,user_id,role,content,model,created_at']),
                'user_message_id' => $userMessage->id,
                'assistant_message_id' => $assistantMessage->id,
            ],
        ], 201);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassModel;
use App\Models\Division;
use App\Models\Fee;
use App\Models\School;
use App\Models\SchoolSetupChecklistState;
use App\Models\Stream;
use App\Models\Subject;
use App\Models\Term;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolSetupController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function progress(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $school = School::findOrFail($schoolId);
        $counts = $this->counts($schoolId);
        $definitions = $this->stepDefinitions();
        $states = SchoolSetupChecklistState::query()->where('school_id', $schoolId)->get()->keyBy('step_key');

        $steps = collect($definitions)->map(function (array $definition) use ($counts, $states): array {
            $complete = $this->isComplete($definition['key'], $counts);
            $blockedBy = collect($definition['requires'])
                ->filter(fn (string $requiredKey) => ! $this->isComplete($requiredKey, $counts))
                ->values()
                ->all();
            $state = $states->get($definition['key']);

            return [
                ...$definition,
                'complete' => $complete,
                'blocked' => $blockedBy !== [],
                'blocked_by' => $blockedBy,
                'acknowledged' => (bool) $state?->acknowledged,
                'last_viewed_at' => $state?->last_viewed_at,
                'acknowledged_at' => $state?->acknowledged_at,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'school' => ['id' => $school->id, 'name' => $school->name],
            'counts' => $counts,
            'completed_steps' => $steps->where('complete', true)->count(),
            'acknowledged_steps' => $steps->where('acknowledged', true)->count(),
            'total_steps' => $steps->count(),
            'steps' => $steps,
        ]);
    }

    public function updateStep(Request $request, string $stepKey)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless(collect($this->stepDefinitions())->pluck('key')->contains($stepKey), 404, 'Setup step not found.');
        $data = $request->validate(['acknowledged' => ['required', 'boolean']]);

        $state = SchoolSetupChecklistState::updateOrCreate(
            ['school_id' => $schoolId, 'step_key' => $stepKey],
            [
                'acknowledged' => (bool) $data['acknowledged'],
                'last_viewed_by' => $request->user()->id,
                'last_viewed_at' => now(),
                'acknowledged_at' => $data['acknowledged'] ? now() : null,
            ],
        );
        ActivityLogService::log(
            module: 'school_setup',
            action: $data['acknowledged'] ? 'step_acknowledged' : 'step_unacknowledged',
            description: 'A school setup checklist acknowledgement was updated.',
            schoolId: $schoolId,
            properties: ['step_key' => $stepKey, 'acknowledged' => (bool) $data['acknowledged']],
        );

        return response()->json(['message' => 'Setup checklist state saved.', 'data' => $state]);
    }

    private function counts(int $schoolId): array
    {
        $academicSessions = AcademicSession::query()->where('school_id', $schoolId);
        $terms = Term::query()->whereHas('academicSession', fn ($query) => $query->where('school_id', $schoolId));
        $leadershipComplete = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.school_id', $schoolId)
            ->whereIn('roles.slug', ['principal', 'vice_principal_academic', 'vice_principal_admin'])
            ->exists();

        return [
            'profile' => 1,
            'academic_sessions' => (clone $academicSessions)->count(),
            'current_academic_sessions' => (clone $academicSessions)->where('is_current', true)->count(),
            'terms' => (clone $terms)->count(),
            'current_terms' => (clone $terms)->where('is_current', true)->count(),
            'divisions' => Division::where('school_id', $schoolId)->count(),
            'classes' => ClassModel::whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->count(),
            'streams' => Stream::whereHas('class.division', fn ($query) => $query->where('school_id', $schoolId))->count(),
            'subjects' => Subject::where('school_id', $schoolId)->count(),
            'fees' => Fee::where('school_id', $schoolId)->count(),
            'leadership' => $leadershipComplete ? 1 : 0,
        ];
    }

    private function stepDefinitions(): array
    {
        return [
            ['key' => 'profile', 'label' => 'School profile', 'page' => 'settings', 'requires' => []],
            ['key' => 'academic_sessions', 'label' => 'Current academic session', 'page' => 'academic-sessions', 'requires' => []],
            ['key' => 'terms', 'label' => 'Current term', 'page' => 'terms', 'requires' => ['academic_sessions']],
            ['key' => 'divisions', 'label' => 'Divisions', 'page' => 'divisions', 'requires' => ['academic_sessions']],
            ['key' => 'classes', 'label' => 'Classes', 'page' => 'classes', 'requires' => ['divisions']],
            ['key' => 'streams', 'label' => 'Streams', 'page' => 'streams', 'requires' => ['classes']],
            ['key' => 'subjects', 'label' => 'Subjects', 'page' => 'subjects', 'requires' => ['academic_sessions']],
            ['key' => 'fees', 'label' => 'Fee structure', 'page' => 'fees', 'requires' => ['academic_sessions', 'terms']],
            ['key' => 'leadership', 'label' => 'Leadership assignment', 'page' => 'role-invitations', 'requires' => ['profile']],
        ];
    }

    private function isComplete(string $key, array $counts): bool
    {
        return match ($key) {
            'academic_sessions' => (int) ($counts['current_academic_sessions'] ?? 0) > 0,
            'terms' => (int) ($counts['current_terms'] ?? 0) > 0,
            default => (int) ($counts[$key] ?? 0) > 0,
        };
    }

}

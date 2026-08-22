<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassModel;
use App\Models\Division;
use App\Models\Fee;
use App\Models\School;
use App\Models\RoleInvitation;
use App\Models\Stream;
use App\Models\Subject;
use App\Models\Term;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class SchoolSetupController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function progress(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 409, 'No active school.');

        $school = School::findOrFail($schoolId);
        $leadershipComplete = RoleInvitation::query()
            ->where('school_id', $schoolId)
            ->where('status', 'accepted')
            ->whereNotNull('accepted_user_id')
            ->whereHas('acceptedUser.roles', function ($query) use ($schoolId) {
                $query->whereIn('roles.slug', ['principal', 'vice_principal_academic', 'vice_principal_admin'])
                    ->where('user_roles.school_id', $schoolId);
            })
            ->exists();

        $counts = [
            'profile' => 1,
            'academic_sessions' => AcademicSession::where('school_id', $schoolId)->count(),
            'terms' => Term::whereHas('academicSession', fn ($query) => $query->where('school_id', $schoolId))->count(),
            'divisions' => Division::where('school_id', $schoolId)->count(),
            'classes' => ClassModel::whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->count(),
            'streams' => Stream::whereHas('class.division', fn ($query) => $query->where('school_id', $schoolId))->count(),
            'subjects' => Subject::where('school_id', $schoolId)->count(),
            'fees' => Fee::where('school_id', $schoolId)->count(),
            'leadership' => $leadershipComplete ? 1 : 0,
        ];

        $steps = [
            ['key' => 'profile', 'label' => 'School profile', 'page' => 'settings', 'complete' => true],
            ['key' => 'academic_sessions', 'label' => 'Academic session', 'page' => 'academic-sessions', 'complete' => $counts['academic_sessions'] > 0],
            ['key' => 'terms', 'label' => 'Terms', 'page' => 'terms', 'complete' => $counts['terms'] > 0],
            ['key' => 'divisions', 'label' => 'Divisions', 'page' => 'divisions', 'complete' => $counts['divisions'] > 0],
            ['key' => 'classes', 'label' => 'Classes', 'page' => 'classes', 'complete' => $counts['classes'] > 0],
            ['key' => 'streams', 'label' => 'Streams', 'page' => 'streams', 'complete' => $counts['streams'] > 0],
            ['key' => 'subjects', 'label' => 'Subjects', 'page' => 'subjects', 'complete' => $counts['subjects'] > 0],
            ['key' => 'fees', 'label' => 'Fee structure', 'page' => 'fees', 'complete' => $counts['fees'] > 0],
            ['key' => 'leadership', 'label' => 'Leadership assignment', 'page' => 'role-invitations', 'complete' => $leadershipComplete],
        ];

        $completed = collect($steps)->where('complete', true)->count();

        return response()->json([
            'success' => true,
            'school' => [
                'id' => $school->id,
                'name' => $school->name,
            ],
            'counts' => $counts,
            'completed_steps' => $completed,
            'total_steps' => count($steps),
            'steps' => $steps,
        ]);
    }
}

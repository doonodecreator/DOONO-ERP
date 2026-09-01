<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExchangeParticipant;
use App\Models\ExchangeProject;
use App\Models\ExchangeProjectSchool;
use App\Models\School;
use App\Models\SchoolExchangeSetting;
use App\Models\Student;
use App\Models\StudentCommunityConsent;
use App\Models\StudentEnrollment;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ExchangeController extends Controller
{
    public function studentIndex(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->activeStudent($request, $schoolId);
        $projects = ExchangeProject::query()->where('status', 'published')->whereHas('participatingSchools', fn ($query) => $query->where('school_id', $schoolId)->where('status', 'accepted'))->with(['school:id,name,country_id', 'participatingSchools.school:id,name,country_id', 'participants' => fn ($query) => $query->where('status', 'approved')->where('school_id', $schoolId)])->latest('approved_at')->paginate(20);
        return response()->json(['data' => $projects, 'student_id' => $student->id]);
    }

    public function join(Request $request, ExchangeProject $exchangeProject)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->activeStudent($request, $schoolId);
        abort_unless($exchangeProject->status === 'published' && $exchangeProject->participatingSchools()->where('school_id', $schoolId)->where('status', 'accepted')->exists(), 404, 'This project is not available to your school.');
        $setting = SchoolExchangeSetting::query()->where('school_id', $schoolId)->where('enabled', true)->first();
        abort_unless($setting, 403, 'Your school has not enabled project exchange.');
        $consent = StudentCommunityConsent::query()->where('school_id', $schoolId)->where('student_id', $student->id)->first();
        if ($exchangeProject->allow_international) {
            abort_unless($setting->international_enabled && $consent?->status === 'approved' && $consent->global_exchange_allowed, 403, 'Guardian consent and school approval are required for this international project.');
        }
        $participant = ExchangeParticipant::query()->firstOrCreate(
            ['exchange_project_id' => $exchangeProject->id, 'student_id' => $student->id],
            ['school_id' => $schoolId, 'display_alias' => 'Learner-' . Str::upper(Str::random(6)), 'status' => 'pending']
        );
        ActivityLogService::log('exchange', 'participant_requested', 'A student requested to join an approved exchange project.', $participant, ['project_id' => $exchangeProject->id], $schoolId);
        return response()->json(['message' => 'Your participation request was sent for school approval.', 'data' => $participant->fresh()->load('project')], 201);
    }

    public function leave(Request $request, ExchangeParticipant $exchangeParticipant)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->activeStudent($request, $schoolId);
        abort_unless((int) $exchangeParticipant->school_id === $schoolId && (int) $exchangeParticipant->student_id === (int) $student->id, 404, 'Participation record not found.');
        $exchangeParticipant->update(['status' => 'withdrawn']);
        ActivityLogService::log('exchange', 'participant_withdrew', 'A student withdrew from an exchange project.', $exchangeParticipant, ['project_id' => $exchangeParticipant->exchange_project_id], $schoolId);
        return response()->json(['message' => 'You left the exchange project.']);
    }

    public function schoolSettings(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $setting = SchoolExchangeSetting::query()->firstOrCreate(['school_id' => $schoolId], ['enabled' => false, 'international_enabled' => false]);
        return response()->json(['data' => $setting]);
    }

    public function updateSchoolSettings(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate(['enabled' => ['required', 'boolean'], 'international_enabled' => ['required', 'boolean'], 'safeguarding_note' => ['nullable', 'string', 'max:2000']]);
        if ($validated['international_enabled'] && ! $validated['enabled']) {
            return response()->json(['message' => 'International exchange cannot be enabled while project exchange is disabled.'], 422);
        }
        $setting = SchoolExchangeSetting::query()->updateOrCreate(['school_id' => $schoolId], $validated + ['approved_by' => $request->user()->id, 'approved_at' => now()]);
        ActivityLogService::log('exchange', 'school_settings_updated', 'School exchange settings were updated.', $setting, ['enabled' => $setting->enabled, 'international_enabled' => $setting->international_enabled], $schoolId);
        return response()->json(['message' => 'Exchange settings saved.', 'data' => $setting]);
    }

    public function optedInSchools(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $international = SchoolExchangeSetting::query()->where('school_id', $schoolId)->where('international_enabled', true)->exists();
        $schools = School::query()->where('id', '!=', $schoolId)->where('status', 'active')->whereHas('exchangeSetting', fn ($query) => $query->where('enabled', true)->when(! $international, fn ($nested) => $nested->where('international_enabled', false)))->with('country:id,name')->orderBy('name')->limit(200)->get(['id', 'name', 'short_name', 'country_id']);
        return response()->json(['data' => $schools]);
    }

    public function projects(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => ExchangeProject::query()->where('school_id', $schoolId)->with(['participatingSchools.school:id,name,country_id', 'participants.student:id,first_name,last_name'])->latest()->paginate(30)]);
    }

    public function storeProject(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless(SchoolExchangeSetting::query()->where('school_id', $schoolId)->where('enabled', true)->exists(), 403, 'Enable project exchange for this school before creating a project.');
        $validated = $request->validate(['title' => ['required', 'string', 'max:180'], 'description' => ['required', 'string', 'max:10000'], 'subject' => ['nullable', 'string', 'max:120'], 'age_band' => ['nullable', 'string', 'max:80'], 'country_focus' => ['nullable', 'string', 'max:120'], 'allow_international' => ['boolean'], 'starts_at' => ['nullable', 'date'], 'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at']]);
        if (($validated['allow_international'] ?? false) && ! SchoolExchangeSetting::query()->where('school_id', $schoolId)->where('international_enabled', true)->exists()) {
            return response()->json(['message' => 'International exchange is not enabled for this school.'], 422);
        }
        $project = ExchangeProject::create($validated + ['school_id' => $schoolId, 'created_by' => $request->user()->id, 'status' => 'pending_review']);
        ExchangeProjectSchool::create(['exchange_project_id' => $project->id, 'school_id' => $schoolId, 'status' => 'accepted', 'invited_by' => $request->user()->id, 'responded_by' => $request->user()->id, 'responded_at' => now()]);
        ActivityLogService::log('exchange', 'project_submitted', 'A school submitted an exchange project for approval.', $project, ['title' => $project->title], $schoolId);
        return response()->json(['message' => 'Project submitted for school approval.', 'data' => $project->load('participatingSchools')], 201);
    }

    public function approveProject(Request $request, ExchangeProject $exchangeProject)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $exchangeProject->school_id === $schoolId, 404, 'Project not found in this school.');
        abort_unless(in_array($exchangeProject->status, ['pending_review', 'draft'], true), 422, 'This project is not awaiting approval.');
        $exchangeProject->update(['status' => 'published', 'approved_by' => $request->user()->id, 'approved_at' => now()]);
        ActivityLogService::log('exchange', 'project_approved', 'A school moderator approved an exchange project.', $exchangeProject, ['title' => $exchangeProject->title], $schoolId);
        return response()->json(['message' => 'Exchange project published.', 'data' => $exchangeProject->fresh()]);
    }

    public function inviteSchool(Request $request, ExchangeProject $exchangeProject)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $exchangeProject->school_id === $schoolId, 404, 'Project not found in this school.');
        $validated = $request->validate(['school_id' => ['required', 'integer', 'exists:schools,id']]);
        $target = School::query()->findOrFail($validated['school_id']);
        abort_unless((int) $target->id !== $schoolId && $target->status === 'active' && SchoolExchangeSetting::query()->where('school_id', $target->id)->where('enabled', true)->exists(), 422, 'The selected school has not opted into project exchange.');
        if ($exchangeProject->allow_international) {
            abort_unless(SchoolExchangeSetting::query()->where('school_id', $target->id)->where('international_enabled', true)->exists(), 422, 'The selected school has not enabled international exchange.');
        }
        $link = ExchangeProjectSchool::query()->updateOrCreate(['exchange_project_id' => $exchangeProject->id, 'school_id' => $target->id], ['status' => 'invited', 'invited_by' => $request->user()->id, 'responded_by' => null, 'responded_at' => null]);
        ActivityLogService::log('exchange', 'school_invited', 'A school was invited to an exchange project.', $link, ['project_id' => $exchangeProject->id, 'target_school_id' => $target->id], $schoolId);
        return response()->json(['message' => 'School invitation sent.', 'data' => $link->load('school:id,name,country_id')], 201);
    }

    public function respondSchoolInvite(Request $request, ExchangeProjectSchool $exchangeProjectSchool)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $exchangeProjectSchool->school_id === $schoolId && $exchangeProjectSchool->status === 'invited', 404, 'Exchange invitation not found.');
        abort_unless(SchoolExchangeSetting::query()->where('school_id', $schoolId)->where('enabled', true)->exists(), 403, 'Enable project exchange before accepting invitations.');
        $validated = $request->validate(['status' => ['required', 'in:accepted,rejected']]);
        $exchangeProjectSchool->update(['status' => $validated['status'], 'responded_by' => $request->user()->id, 'responded_at' => now()]);
        ActivityLogService::log('exchange', 'school_invitation_responded', 'A school responded to an exchange project invitation.', $exchangeProjectSchool, ['project_id' => $exchangeProjectSchool->exchange_project_id, 'status' => $validated['status']], $schoolId);
        return response()->json(['message' => 'Exchange invitation updated.', 'data' => $exchangeProjectSchool->fresh()->load('project')]);
    }

    public function approveParticipant(Request $request, ExchangeParticipant $exchangeParticipant)
    {
        $schoolId = $this->requireSchool($request);
        $participant = $exchangeParticipant->load('project');
        abort_unless((int) $participant->project->school_id === $schoolId || (int) $participant->school_id === $schoolId, 404, 'Participant not found in this school context.');
        abort_unless($participant->status === 'pending', 422, 'This participation request is not pending.');
        abort_unless($participant->project->status === 'published', 422, 'The project must be published before participants are approved.');
        $participant->update(['status' => 'approved', 'approved_by' => $request->user()->id, 'approved_at' => now()]);
        ActivityLogService::log('exchange', 'participant_approved', 'A school moderator approved an exchange participant.', $participant, ['project_id' => $participant->exchange_project_id, 'participant_school_id' => $participant->school_id], $schoolId);
        return response()->json(['message' => 'Participant approved.', 'data' => $participant->fresh()->load('student:id,first_name,last_name')]);
    }

    public function moderation(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $projects = ExchangeProject::query()->where('school_id', $schoolId)->with(['participatingSchools.school:id,name,country_id', 'participants.student:id,first_name,last_name'])->latest()->paginate(30, ['*'], 'projects_page');
        $invitations = ExchangeProjectSchool::query()->where('school_id', $schoolId)->with('project.school:id,name,country_id')->latest()->paginate(30, ['*'], 'invitations_page');
        return response()->json(['data' => ['projects' => $projects, 'invitations' => $invitations]]);
    }

    private function activeStudent(Request $request, int $schoolId): Student
    {
        $student = Student::query()->where('school_id', $schoolId)->where('user_id', $request->user()->id)->where('status', 'Active')->first();
        abort_unless($student, 403, 'An active linked student record is required.');
        $activeEnrollment = StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists();
        abort_unless($activeEnrollment, 403, 'An active school enrollment is required.');
        return $student;
    }
}

<?php

namespace App\Services;

use App\Models\AcademicSession;
use App\Models\AppNotification;
use App\Models\ClassModel;
use App\Models\Communication;
use App\Models\Division;
use App\Models\LeaveRequest;
use App\Models\ResultSubmission;
use App\Models\RoleInvitation;
use App\Models\SchoolSetupChecklistState;
use App\Models\Stream;
use App\Models\Subject;
use App\Models\Term;
use App\Models\Timetable;
use App\Models\User;
use Illuminate\Support\Collection;

class WorkInboxService
{
    public function __construct(private CurrentContextService $context) {}

    public function for(User $user): array
    {
        $school = $this->context->currentSchool($user);
        $organization = $this->context->currentOrganization($user, $school);
        $items = collect();

        if (! $school) {
            if ($this->context->isOrganizationOwner($user) && $organization) {
                $items->push($this->item(
                    'organization-school',
                    'Create or select a school',
                    'Choose a school before working with school records.',
                    'high',
                    'schools',
                    'organization'
                ));
            }
        } else {
            $this->addSetupItem($items, $user, (int) $school->id);
            $this->addApprovalItem($items, $user, (int) $school->id, 'results');
            $this->addTimetableItem($items, $user, (int) $school->id);
            $this->addLeaveItem($items, $user, (int) $school->id);
            $this->addInvitationItem($items, $user, (int) $school->id);
            $this->addCommunicationFailureItem($items, $user, (int) $school->id);
        }

        $this->addUnreadNotificationItem($items, $user, $school?->id, $organization?->id);

        $sorted = $items
            ->sortBy(fn (array $item) => [$this->priorityRank($item['priority']), $item['created_at']])
            ->values();

        return [
            'items' => $sorted->all(),
            'summary' => [
                'total' => $sorted->count(),
                'high' => $sorted->where('priority', 'high')->count(),
                'medium' => $sorted->where('priority', 'medium')->count(),
                'low' => $sorted->where('priority', 'low')->count(),
            ],
            'context' => [
                'organization_id' => $organization?->id,
                'school_id' => $school?->id,
            ],
            'generated_at' => now()->toIso8601String(),
        ];
    }

    private function addSetupItem(Collection $items, User $user, int $schoolId): void
    {
        $definitions = [
            ['key' => 'academic_sessions', 'label' => 'Academic session', 'page' => 'academic-sessions', 'permission' => 'manage_academic_sessions', 'count' => AcademicSession::where('school_id', $schoolId)->count(), 'requires' => []],
            ['key' => 'terms', 'label' => 'Term', 'page' => 'terms', 'permission' => 'manage_terms', 'count' => Term::whereHas('academicSession', fn ($query) => $query->where('school_id', $schoolId))->count(), 'requires' => ['academic_sessions']],
            ['key' => 'divisions', 'label' => 'Division', 'page' => 'divisions', 'permission' => 'manage_divisions', 'count' => Division::where('school_id', $schoolId)->count(), 'requires' => ['academic_sessions']],
            ['key' => 'classes', 'label' => 'Class', 'page' => 'classes', 'permission' => 'manage_classes', 'count' => ClassModel::whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->count(), 'requires' => ['divisions']],
            ['key' => 'streams', 'label' => 'Stream', 'page' => 'streams', 'permission' => 'manage_streams', 'count' => Stream::whereHas('class.division', fn ($query) => $query->where('school_id', $schoolId))->count(), 'requires' => ['classes']],
            ['key' => 'subjects', 'label' => 'Subject', 'page' => 'subjects', 'permission' => 'manage_subjects', 'count' => Subject::where('school_id', $schoolId)->count(), 'requires' => ['academic_sessions']],
        ];
        $counts = collect($definitions)->pluck('count', 'key');
        $state = SchoolSetupChecklistState::where('school_id', $schoolId)->where('acknowledged', true)->pluck('step_key')->all();

        foreach ($definitions as $definition) {
            if ((int) $definition['count'] > 0 || ! $user->hasPermission($definition['permission'], $schoolId)) {
                continue;
            }
            $blocked = collect($definition['requires'])->contains(fn (string $required) => (int) $counts->get($required, 0) === 0);
            if ($blocked) {
                continue;
            }
            $acknowledged = in_array($definition['key'], $state, true);
            $items->push($this->item(
                'setup-'.$definition['key'],
                'Complete school setup: '.$definition['label'],
                $acknowledged ? 'This setup step is still empty after it was acknowledged.' : 'This foundation record is required before dependent school workflows can work.',
                'high',
                $definition['page'],
                'setup'
            ));
            break;
        }
    }

    private function addApprovalItem(Collection $items, User $user, int $schoolId, string $type): void
    {
        if (! $user->hasPermission('approve_results', $schoolId)) {
            return;
        }
        $count = ResultSubmission::where('school_id', $schoolId)->whereNotNull('submitted_at')->whereNull('approved_at')->count();
        if ($count > 0) {
            $items->push($this->item('results-approval', 'Review result submissions', $count.' result submission(s) are waiting for academic approval.', 'high', 'results', $type, $count));
        }
    }

    private function addTimetableItem(Collection $items, User $user, int $schoolId): void
    {
        if (! $user->hasPermission('approve_timetable', $schoolId)) {
            return;
        }
        $count = Timetable::where('school_id', $schoolId)->where('workflow_status', 'submitted')->count();
        if ($count > 0) {
            $items->push($this->item('timetable-approval', 'Approve submitted timetable work', $count.' timetable item(s) are waiting for approval.', 'high', 'timetable', 'timetable', $count));
        }
    }

    private function addLeaveItem(Collection $items, User $user, int $schoolId): void
    {
        if (! $user->hasRole('proprietor', $schoolId)
            && ! $user->hasRole('principal', $schoolId)
            && ! $user->hasRole('vice_principal_admin', $schoolId)
        ) {
            return;
        }
        $count = LeaveRequest::where('school_id', $schoolId)->where('status', 'Pending')->count();
        if ($count > 0) {
            $items->push($this->item('leave-review', 'Review staff leave requests', $count.' leave request(s) are waiting for a decision.', 'medium', 'leave-requests', 'leave', $count));
        }
    }

    private function addInvitationItem(Collection $items, User $user, int $schoolId): void
    {
        if (! $user->hasPermission('assign_roles', $schoolId)) {
            return;
        }
        $count = RoleInvitation::where('school_id', $schoolId)->where('status', 'pending')->where('expires_at', '>', now())->count();
        if ($count > 0) {
            $items->push($this->item('role-invitations', 'Follow up role invitations', $count.' invitation(s) are still waiting for acceptance.', 'medium', 'role-invitations', 'invitations', $count));
        }
    }

    private function addCommunicationFailureItem(Collection $items, User $user, int $schoolId): void
    {
        if (! $user->hasPermission('send_communication', $schoolId)) {
            return;
        }
        $count = Communication::where('school_id', $schoolId)
            ->whereIn('delivery_status', ['failed', 'partially_delivered'])
            ->count();
        if ($count > 0) {
            $items->push($this->item('communication-failures', 'Review communication delivery', $count.' communication item(s) have failed or partially delivered recipients and may need review or retry.', 'high', 'communication', 'communication', $count));
        }
    }

    private function addUnreadNotificationItem(Collection $items, User $user, ?int $schoolId, ?int $organizationId): void
    {
        $query = AppNotification::where('user_id', $user->id)->whereNull('read_at');
        if ($user->isSuperAdmin()) {
            // Platform administrators may see their own platform notifications.
        } elseif ($schoolId) {
            $query->where('school_id', $schoolId);
        } elseif ($organizationId) {
            $query->where('organization_id', $organizationId);
        } else {
            $query->whereNull('school_id')->whereNull('organization_id');
        }
        $count = $query->count();
        if ($count > 0) {
            $items->push($this->item('unread-notifications', 'Read unread notifications', $count.' unread notification(s) are waiting in your current context.', 'medium', 'notifications', 'notifications', $count));
        }
    }

    private function item(string $key, string $title, string $description, string $priority, string $page, string $type, int $count = 1): array
    {
        return [
            'key' => $key,
            'title' => $title,
            'description' => $description,
            'priority' => $priority,
            'page' => $page,
            'type' => $type,
            'count' => $count,
            'created_at' => now()->toIso8601String(),
        ];
    }

    private function priorityRank(string $priority): int
    {
        return ['high' => 0, 'medium' => 1, 'low' => 2][$priority] ?? 3;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewLeaveRequest;
use App\Http\Requests\StoreLeaveRequest;
use App\Http\Resources\LeaveRequestResource;
use App\Models\LeaveRequest;
use App\Models\Staff;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\LeaveRequestService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LeaveRequestController extends Controller
{
    private const LEADERSHIP_ROLES = [
        'proprietor',
        'principal',
        'vice_principal_admin',
    ];

    public function __construct(
        private CurrentContextService $context,
        private LeaveRequestService $leaveRequestService
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $staff = $this->currentStaff($request, $schoolId);
        $isLeadership = $this->isLeadership($request, $schoolId);

        abort_unless($isLeadership || $staff, 403);

        $query = LeaveRequest::with(['staff', 'requester', 'reviewer'])
            ->where('school_id', $schoolId)
            ->when(!$isLeadership, function ($query) use ($staff) {
                $query->where('staff_id', $staff->id);
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('status', $request->input('status'));
            })
            ->latest();

        return LeaveRequestResource::collection(
            $query->paginate($this->perPage($request))
        );
    }

    public function options(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $staff = $this->currentStaff($request, $schoolId);
        $isLeadership = $this->isLeadership($request, $schoolId);

        abort_unless($isLeadership || $staff, 403);

        $staffOptions = $isLeadership
            ? Staff::where('school_id', $schoolId)
                ->where('employment_status', 'Active')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
            : collect([$staff]);

        return response()->json([
            'can_manage' => $isLeadership,
            'data' => $staffOptions->map(fn (Staff $member) => [
                'id' => $member->id,
                'staff_number' => $member->staff_number,
                'full_name' => $member->full_name,
                'designation' => $member->designation,
                'department' => $member->department,
            ])->values(),
        ]);
    }

    public function store(StoreLeaveRequest $request)
    {
        $schoolId = $this->requireSchool($request);
        $currentStaff = $this->currentStaff($request, $schoolId);
        $isLeadership = $this->isLeadership($request, $schoolId);
        $data = $request->validated();

        if (!$isLeadership) {
            abort_unless($currentStaff && $currentStaff->id === (int) $data['staff_id'], 403);
        }

        $leaveRequest = $this->leaveRequestService->create([
            ...$data,
            'school_id' => $schoolId,
            'requested_by' => $request->user()->id,
            'status' => 'Pending',
        ]);

        ActivityLogService::log(
            module: 'leave_requests',
            action: 'requested',
            description: "Leave request submitted from {$leaveRequest->start_date->format('Y-m-d')} to {$leaveRequest->end_date->format('Y-m-d')}",
            subject: $leaveRequest,
            schoolId: $schoolId,
        );

        return (new LeaveRequestResource(
            $leaveRequest->load(['staff', 'requester', 'reviewer'])
        ))->response()->setStatusCode(201);
    }

    public function show(Request $request, LeaveRequest $leaveRequest)
    {
        $schoolId = $this->requireSchool($request);
        $this->ensureVisibleToRequesterOrLeadership($request, $leaveRequest, $schoolId);

        return new LeaveRequestResource(
            $leaveRequest->load(['staff', 'requester', 'reviewer'])
        );
    }

    public function review(
        ReviewLeaveRequest $request,
        LeaveRequest $leaveRequest
    ) {
        $schoolId = $this->requireSchool($request);

        abort_unless($this->isLeadership($request, $schoolId), 403);
        abort_unless($leaveRequest->school_id === $schoolId, 403);

        if ($leaveRequest->status !== 'Pending') {
            throw ValidationException::withMessages([
                'status' => ['Only pending leave requests can be reviewed.'],
            ]);
        }

        $leaveRequest->loadMissing('staff');

        if ($leaveRequest->staff?->user_id === $request->user()->id) {
            throw ValidationException::withMessages([
                'status' => ['You cannot review your own leave request.'],
            ]);
        }

        $data = $request->validated();
        $leaveRequest->update([
            'status' => $data['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'reviewer_note' => $data['reviewer_note'] ?? null,
        ]);

        ActivityLogService::log(
            module: 'leave_requests',
            action: strtolower($data['status']),
            description: "Leave request {$data['status']}.",
            subject: $leaveRequest,
            schoolId: $schoolId,
        );

        return new LeaveRequestResource(
            $leaveRequest->load(['staff', 'requester', 'reviewer'])
        );
    }

    public function cancel(Request $request, LeaveRequest $leaveRequest)
    {
        $schoolId = $this->requireSchool($request);
        $this->ensureVisibleToRequesterOrLeadership($request, $leaveRequest, $schoolId);

        if ($leaveRequest->status !== 'Pending') {
            throw ValidationException::withMessages([
                'status' => ['Only pending leave requests can be cancelled.'],
            ]);
        }

        $leaveRequest->update(['status' => 'Cancelled']);

        ActivityLogService::log(
            module: 'leave_requests',
            action: 'cancelled',
            description: 'Leave request cancelled.',
            subject: $leaveRequest,
            schoolId: $schoolId,
        );

        return new LeaveRequestResource(
            $leaveRequest->load(['staff', 'requester', 'reviewer'])
        );
    }

    private function ensureVisibleToRequesterOrLeadership(
        Request $request,
        LeaveRequest $leaveRequest,
        int $schoolId
    ): void {
        abort_unless($leaveRequest->school_id === $schoolId, 403);

        if ($this->isLeadership($request, $schoolId)) {
            return;
        }

        $staff = $this->currentStaff($request, $schoolId);

        abort_unless($staff && $leaveRequest->staff_id === $staff->id, 403);
    }

    private function currentStaff(Request $request, int $schoolId): ?Staff
    {
        return Staff::where('school_id', $schoolId)
            ->where('user_id', $request->user()->id)
            ->first();
    }

    private function isLeadership(Request $request, int $schoolId): bool
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return true;
        }

        $roles = $this->context->resolve($user)['roles'] ?? [];

        return collect($roles)->contains(function (array $role) use ($schoolId) {
            return $role['school_id'] === $schoolId
                && in_array($role['slug'], self::LEADERSHIP_ROLES, true);
        });
    }


    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 25), 1), 100);
    }
}

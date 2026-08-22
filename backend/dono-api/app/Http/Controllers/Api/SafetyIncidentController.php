<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewSafetyIncidentRequest;
use App\Http\Requests\StoreSafetyIncidentRequest;
use App\Http\Resources\SafetyIncidentResource;
use App\Models\ClinicVisit;
use App\Models\SafetyIncident;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Visitor;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\SafetyIncidentService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SafetyIncidentController extends Controller
{
    private const MANAGEMENT_ROLES = [
        'proprietor',
        'principal',
        'vice_principal_admin',
    ];

    private const REPORTER_ROLES = [
        'proprietor',
        'principal',
        'vice_principal_admin',
        'teacher',
        'form_teacher',
        'nurse',
        'receptionist',
        'transport_manager',
        'hostel_master',
        'hostel_mistress',
    ];

    public function __construct(
        private CurrentContextService $context,
        private SafetyIncidentService $safetyIncidentService
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $isManagement = $this->isManagement($request, $schoolId);

        abort_unless($isManagement || $this->mayReport($request, $schoolId), 403);

        $query = SafetyIncident::with([
            'student',
            'staff',
            'visitor',
            'clinicVisit',
            'reporter',
            'reviewer',
        ])->where('school_id', $schoolId)
            ->when(!$isManagement, function ($query) use ($request) {
                $query->where('reported_by', $request->user()->id);
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('status', $request->input('status'));
            })
            ->latest('incident_at')
            ->latest('id');

        return SafetyIncidentResource::collection(
            $query->paginate($this->perPage($request))
        );
    }

    public function options(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $isManagement = $this->isManagement($request, $schoolId);

        abort_unless($isManagement || $this->mayReport($request, $schoolId), 403);

        $search = trim((string) $request->input('search'));
        $studentId = $request->integer('student_id');

        $students = Student::where('school_id', $schoolId)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('admission_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(50)
            ->get()
            ->map(fn (Student $student) => [
                'id' => $student->id,
                'label' => "{$student->full_name} ({$student->admission_number})",
            ]);

        $staff = Staff::where('school_id', $schoolId)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('staff_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(50)
            ->get()
            ->map(fn (Staff $staffMember) => [
                'id' => $staffMember->id,
                'label' => "{$staffMember->full_name} ({$staffMember->staff_number})",
            ]);

        $visitors = Visitor::where('school_id', $schoolId)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('visitor_name', 'like', "%{$search}%")
                        ->orWhere('phone_number', 'like', "%{$search}%");
                });
            })
            ->latest('check_in_time')
            ->limit(50)
            ->get()
            ->map(fn (Visitor $visitor) => [
                'id' => $visitor->id,
                'label' => $visitor->visitor_name,
            ]);

        $clinicVisits = $studentId
            ? ClinicVisit::where('school_id', $schoolId)
                ->where('student_id', $studentId)
                ->latest('visit_date')
                ->limit(25)
                ->get()
                ->map(fn (ClinicVisit $visit) => [
                    'id' => $visit->id,
                    'label' => $visit->visit_date?->format('Y-m-d H:i') . ' — ' . $visit->complaint,
                ])
            : collect();

        return response()->json([
            'can_manage' => $isManagement,
            'students' => $students->values(),
            'staff' => $staff->values(),
            'visitors' => $visitors->values(),
            'clinic_visits' => $clinicVisits->values(),
        ]);
    }

    public function store(StoreSafetyIncidentRequest $request)
    {
        $schoolId = $this->requireSchool($request);

        abort_unless($this->mayReport($request, $schoolId), 403);

        $incident = $this->safetyIncidentService->create([
            ...$request->validated(),
            'school_id' => $schoolId,
            'reported_by' => $request->user()->id,
            'requires_medical_attention' => $request->boolean('requires_medical_attention'),
        ]);

        ActivityLogService::log(
            module: 'safety_incidents',
            action: 'reported',
            description: "Safety incident {$incident->incident_number} reported.",
            subject: $incident,
            schoolId: $schoolId,
        );

        return (new SafetyIncidentResource(
            $incident->load($this->resourceRelationships())
        ))->response()->setStatusCode(201);
    }

    public function show(Request $request, SafetyIncident $safetyIncident)
    {
        $schoolId = $this->requireSchool($request);
        $this->ensureVisibleToReporterOrManagement($request, $safetyIncident, $schoolId);

        return new SafetyIncidentResource(
            $safetyIncident->load($this->resourceRelationships())
        );
    }

    public function review(
        ReviewSafetyIncidentRequest $request,
        SafetyIncident $safetyIncident
    ) {
        $schoolId = $this->requireSchool($request);

        abort_unless($this->isManagement($request, $schoolId), 403);
        abort_unless($safetyIncident->school_id === $schoolId, 403);

        if ($safetyIncident->reported_by === $request->user()->id) {
            throw ValidationException::withMessages([
                'status' => ['You cannot review your own safety incident report.'],
            ]);
        }

        if ($safetyIncident->status === 'Closed') {
            throw ValidationException::withMessages([
                'status' => ['Closed safety incidents cannot be reviewed again.'],
            ]);
        }

        $data = $request->validated();

        if ($data['status'] === 'Closed' && $safetyIncident->status !== 'Resolved') {
            throw ValidationException::withMessages([
                'status' => ['A safety incident must be resolved before it can be closed.'],
            ]);
        }

        if ($safetyIncident->subject_type !== 'Student' && !empty($data['guardian_contacted'])) {
            throw ValidationException::withMessages([
                'guardian_contacted' => ['Only student safety incidents can record guardian contact.'],
            ]);
        }

        $updates = [
            'status' => $data['status'],
            'immediate_action' => $data['immediate_action'] ?? $safetyIncident->immediate_action,
            'resolution_notes' => $data['resolution_notes'] ?? $safetyIncident->resolution_notes,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ];

        if (array_key_exists('guardian_contacted', $data)) {
            $updates['guardian_contacted'] = $data['guardian_contacted'];
            $updates['guardian_contacted_at'] = $data['guardian_contacted']
                ? ($safetyIncident->guardian_contacted_at ?? now())
                : null;
        }

        if (array_key_exists('emergency_services_contacted', $data)) {
            $updates['emergency_services_contacted'] = $data['emergency_services_contacted'];
            $updates['emergency_services_contacted_at'] = $data['emergency_services_contacted']
                ? ($safetyIncident->emergency_services_contacted_at ?? now())
                : null;
        }

        $safetyIncident->update($updates);

        ActivityLogService::log(
            module: 'safety_incidents',
            action: strtolower(str_replace(' ', '_', $data['status'])),
            description: "Safety incident {$safetyIncident->incident_number} marked {$data['status']}.",
            subject: $safetyIncident,
            schoolId: $schoolId,
        );

        return new SafetyIncidentResource(
            $safetyIncident->load($this->resourceRelationships())
        );
    }

    private function ensureVisibleToReporterOrManagement(
        Request $request,
        SafetyIncident $safetyIncident,
        int $schoolId
    ): void {
        abort_unless($safetyIncident->school_id === $schoolId, 403);

        if ($this->isManagement($request, $schoolId)) {
            return;
        }

        abort_unless($safetyIncident->reported_by === $request->user()->id, 403);
    }

    private function mayReport(Request $request, int $schoolId): bool
    {
        return $this->hasAnyRole($request, $schoolId, self::REPORTER_ROLES);
    }

    private function isManagement(Request $request, int $schoolId): bool
    {
        return $this->hasAnyRole($request, $schoolId, self::MANAGEMENT_ROLES);
    }

    private function hasAnyRole(Request $request, int $schoolId, array $roleSlugs): bool
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return true;
        }

        $roles = $this->context->resolve($user)['roles'] ?? [];

        return collect($roles)->contains(function (array $role) use ($schoolId, $roleSlugs) {
            return $role['school_id'] === $schoolId
                && in_array($role['slug'], $roleSlugs, true);
        });
    }


    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 25), 1), 100);
    }

    private function resourceRelationships(): array
    {
        return ['student', 'staff', 'visitor', 'clinicVisit', 'reporter', 'reviewer'];
    }
}

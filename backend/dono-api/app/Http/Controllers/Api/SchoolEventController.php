<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSchoolEventRequest;
use App\Http\Requests\UpdateSchoolEventRequest;
use App\Http\Resources\SchoolEventResource;
use App\Models\SchoolEvent;
use App\Models\Staff;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class SchoolEventController extends Controller
{
    public function __construct(
        private CurrentContextService $context
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $query = SchoolEvent::with($this->resourceRelationships())
            ->where('school_id', $schoolId)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->input('status')))
            ->when($request->filled('event_type'), fn ($query) => $query->where('event_type', $request->input('event_type')))
            ->when($request->filled('from'), fn ($query) => $query->whereDate('start_at', '>=', $request->input('from')))
            ->when($request->filled('to'), fn ($query) => $query->whereDate('start_at', '<=', $request->input('to')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->input('search'));
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('venue', 'like', "%{$search}%")
                        ->orWhere('audience', 'like', "%{$search}%");
                });
            })
            ->orderBy('start_at');

        return SchoolEventResource::collection($query->paginate($this->perPage($request)));
    }

    public function options(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $search = trim((string) $request->input('search'));

        $staff = Staff::where('school_id', $schoolId)
            ->where('employment_status', 'Active')
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

        return response()->json(['data' => $staff->values()]);
    }

    public function store(StoreSchoolEventRequest $request)
    {
        $schoolId = $this->requireSchool($request);
        $event = SchoolEvent::create([
            ...$request->validated(),
            'school_id' => $schoolId,
            'created_by' => $request->user()->id,
            'status' => 'Planned',
        ]);

        ActivityLogService::log(
            module: 'school_events',
            action: 'created',
            description: "Event {$event->title} scheduled.",
            subject: $event,
            schoolId: $schoolId,
        );

        return (new SchoolEventResource($event->load($this->resourceRelationships())))
            ->response()->setStatusCode(201);
    }

    public function show(Request $request, SchoolEvent $schoolEvent)
    {
        $this->ensureSchoolEvent($request, $schoolEvent);

        return new SchoolEventResource($schoolEvent->load($this->resourceRelationships()));
    }

    public function update(UpdateSchoolEventRequest $request, SchoolEvent $schoolEvent)
    {
        $schoolId = $this->ensureSchoolEvent($request, $schoolEvent);
        $data = $request->validated();
        $statusChanged = array_key_exists('status', $data) && $schoolEvent->status !== $data['status'];
        $schoolEvent->update($data);

        ActivityLogService::log(
            module: 'school_events',
            action: $statusChanged ? 'status_changed' : 'updated',
            description: $statusChanged
                ? "Event {$schoolEvent->title} status changed to {$schoolEvent->status}."
                : "Event {$schoolEvent->title} updated.",
            subject: $schoolEvent,
            schoolId: $schoolId,
        );

        return new SchoolEventResource($schoolEvent->load($this->resourceRelationships()));
    }

    private function ensureSchoolEvent(Request $request, SchoolEvent $schoolEvent): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless($schoolEvent->school_id === $schoolId, 403);

        return $schoolId;
    }


    private function resourceRelationships(): array
    {
        return ['school', 'organizer', 'creator'];
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 25), 1), 100);
    }
}

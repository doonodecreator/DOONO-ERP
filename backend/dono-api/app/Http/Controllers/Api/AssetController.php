<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssetRequest;
use App\Http\Requests\UpdateAssetRequest;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use App\Models\AssetLifecycleEvent;
use App\Models\Staff;
use App\Services\ActivityLogService;
use App\Services\AssetService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AssetController extends Controller
{
    public function __construct(
        private CurrentContextService $context,
        private AssetService $assetService
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $query = Asset::with($this->resourceRelationships())
            ->where('school_id', $schoolId)
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('status', $request->input('status'));
            })
            ->when($request->filled('category'), function ($query) use ($request) {
                $query->where('category', $request->input('category'));
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->input('search'));
                $query->where(function ($query) use ($search) {
                    $query->where('asset_number', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                });
            })
            ->latest('id');

        return AssetResource::collection($query->paginate($this->perPage($request)));
    }

    public function options(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $search = trim((string) $request->input('search'));

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

        return response()->json(['data' => $staff->values()]);
    }

    public function store(StoreAssetRequest $request)
    {
        $schoolId = $this->requireSchool($request);

        $asset = $this->assetService->create([
            ...$request->validated(),
            'school_id' => $schoolId,
            'registered_by' => $request->user()->id,
        ]);

        ActivityLogService::log(
            module: 'assets',
            action: 'registered',
            description: "Asset {$asset->asset_number} registered.",
            subject: $asset,
            schoolId: $schoolId,
        );

        return (new AssetResource($asset->load($this->resourceRelationships())))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Asset $asset)
    {
        $this->ensureSchoolAsset($request, $asset);

        return new AssetResource($asset->load($this->resourceRelationships()));
    }

    public function update(UpdateAssetRequest $request, Asset $asset)
    {
        $schoolId = $this->ensureSchoolAsset($request, $asset);
        $data = $request->validated();
        $statusChanged = array_key_exists('status', $data)
            && $asset->status !== $data['status'];

        $asset->update($data);

        ActivityLogService::log(
            module: 'assets',
            action: $statusChanged ? 'status_changed' : 'updated',
            description: $statusChanged
                ? "Asset {$asset->asset_number} status changed to {$asset->status}."
                : "Asset {$asset->asset_number} updated.",
            subject: $asset,
            schoolId: $schoolId,
        );

        return new AssetResource($asset->load($this->resourceRelationships()));
    }

    public function history(Request $request, Asset $asset)
    {
        $schoolId = $this->ensureSchoolAsset($request, $asset);
        $events = AssetLifecycleEvent::query()
            ->where('school_id', $schoolId)
            ->where('asset_id', $asset->id)
            ->with('actor:id,name')
            ->latest('occurred_at')
            ->paginate($this->perPage($request));

        return response()->json($events);
    }

    public function transition(Request $request, Asset $asset)
    {
        $schoolId = $this->ensureSchoolAsset($request, $asset);
        $validated = $request->validate([
            'event_type' => ['required', Rule::in(['maintenance_start', 'maintenance_complete', 'mark_lost', 'recover', 'dispose', 'handover'])],
            'notes' => ['required', 'string', 'min:2', 'max:2000'],
            'location' => ['nullable', 'string', 'max:255'],
            'custodian_staff_id' => ['nullable', 'integer', Rule::exists('staff', 'id')->where('school_id', $schoolId)],
            'condition' => ['nullable', Rule::in(['New', 'Good', 'Fair', 'Poor'])],
        ]);

        $updated = DB::transaction(function () use ($validated, $asset, $schoolId, $request) {
            $locked = Asset::query()->whereKey($asset->id)->where('school_id', $schoolId)->lockForUpdate()->firstOrFail();
            $before = $locked->only(['status', 'condition', 'location', 'custodian_staff_id', 'notes']);
            $eventType = $validated['event_type'];
            $statusMap = [
                'maintenance_start' => 'In Repair',
                'maintenance_complete' => 'Active',
                'mark_lost' => 'Lost',
                'recover' => 'Active',
                'dispose' => 'Disposed',
            ];
            if ($eventType === 'maintenance_start') abort_unless($locked->status === 'Active', 422, 'Only an active asset can enter maintenance.');
            if ($eventType === 'maintenance_complete') abort_unless($locked->status === 'In Repair', 422, 'Only an asset in repair can be marked complete.');
            if ($eventType === 'mark_lost') abort_unless(in_array($locked->status, ['Active', 'In Repair'], true), 422, 'Only an active or in-repair asset can be marked lost.');
            if ($eventType === 'recover') abort_unless($locked->status === 'Lost', 422, 'Only a lost asset can be recovered.');
            if ($eventType === 'dispose') abort_unless($locked->status !== 'Disposed', 422, 'This asset has already been disposed.');
            if ($eventType === 'handover') {
                abort_unless(filled($validated['location'] ?? null) || filled($validated['custodian_staff_id'] ?? null), 422, 'Provide a new location or custodian for a handover.');
                abort_unless($locked->status !== 'Disposed', 422, 'A disposed asset cannot be handed over.');
            }

            $changes = ['notes' => $validated['notes']];
            if (isset($statusMap[$eventType])) $changes['status'] = $statusMap[$eventType];
            if ($eventType === 'handover') {
                foreach (['location', 'custodian_staff_id', 'condition'] as $field) {
                    if (array_key_exists($field, $validated)) $changes[$field] = $validated[$field];
                }
            }
            $locked->update($changes);
            $after = $locked->fresh()->only(array_keys($before));
            AssetLifecycleEvent::create([
                'school_id' => $schoolId,
                'asset_id' => $locked->id,
                'actor_id' => $request->user()->id,
                'event_type' => $eventType,
                'before_state' => $before,
                'after_state' => $after,
                'notes' => $validated['notes'],
                'occurred_at' => now(),
            ]);
            ActivityLogService::log('assets', 'lifecycle_transition', "Asset {$locked->asset_number} recorded {$eventType}.", $locked, ['event_type' => $eventType, 'before' => $before, 'after' => $after], $schoolId);
            return $locked->load($this->resourceRelationships());
        });

        return new AssetResource($updated);
    }

    private function ensureSchoolAsset(Request $request, Asset $asset): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless($asset->school_id === $schoolId, 403);

        return $schoolId;
    }


    private function resourceRelationships(): array
    {
        return ['school', 'custodian', 'registrar'];
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 25), 1), 100);
    }
}

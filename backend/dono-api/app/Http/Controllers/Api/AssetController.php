<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssetRequest;
use App\Http\Requests\UpdateAssetRequest;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use App\Models\Staff;
use App\Services\ActivityLogService;
use App\Services\AssetService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function __construct(
        private CurrentContextService $context,
        private AssetService $assetService
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->currentSchoolId($request);

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
        $schoolId = $this->currentSchoolId($request);

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
        $schoolId = $this->currentSchoolId($request);

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

    private function ensureSchoolAsset(Request $request, Asset $asset): int
    {
        $schoolId = $this->currentSchoolId($request);
        abort_unless($asset->school_id === $schoolId, 403);

        return $schoolId;
    }

    private function currentSchoolId(Request $request): int
    {
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 409, 'No active school.');

        return (int) $schoolId;
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

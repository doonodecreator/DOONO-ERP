<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceApp;
use App\Models\SchoolMarketplaceInstallation;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MarketplaceController extends Controller
{
    public function __construct(private CurrentContextService $context) {}

    public function catalog()
    {
        return response()->json(['data' => MarketplaceApp::query()
            ->where('status', 'published')
            ->where('review_status', 'approved')
            ->orderBy('name')
            ->get()]);
    }

    public function installations(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        return response()->json([
            'data' => SchoolMarketplaceInstallation::query()
                ->where('school_id', $schoolId)
                ->with('app')
                ->latest('id')
                ->get(),
        ]);
    }

    public function install(Request $request, MarketplaceApp $marketplaceApp)
    {
        $schoolId = $this->resolveSchoolId($request);
        abort_unless($marketplaceApp->status === 'published' && $marketplaceApp->review_status === 'approved', 404);
        $data = $request->validate([
            'configuration' => ['nullable', 'array', 'max:30'],
        ]);

        $installation = DB::transaction(function () use ($request, $schoolId, $marketplaceApp, $data): SchoolMarketplaceInstallation {
            $installation = SchoolMarketplaceInstallation::query()->updateOrCreate(
                ['school_id' => $schoolId, 'marketplace_app_id' => $marketplaceApp->id],
                [
                    'installed_by' => $request->user()->id,
                    'status' => 'active',
                    'configuration' => $data['configuration'] ?? null,
                    'installed_at' => now(),
                    'revoked_at' => null,
                ],
            );
            ActivityLogService::log(
                module: 'marketplace',
                action: 'installed',
                description: "Marketplace app {$marketplaceApp->slug} was installed for the school.",
                subject: $installation,
                properties: ['app_slug' => $marketplaceApp->slug],
                schoolId: $schoolId,
            );
            return $installation->load('app');
        });

        return response()->json(['message' => 'Marketplace app installed for this school.', 'data' => $installation], 201);
    }

    public function uninstall(Request $request, SchoolMarketplaceInstallation $installation)
    {
        $schoolId = $this->resolveSchoolId($request);
        abort_unless((int) $installation->school_id === $schoolId, 404);
        $installation->forceFill(['status' => 'revoked', 'revoked_at' => now()])->save();
        ActivityLogService::log(
            module: 'marketplace',
            action: 'uninstalled',
            description: 'A marketplace app installation was revoked for the school.',
            subject: $installation,
            properties: ['marketplace_app_id' => $installation->marketplace_app_id],
            schoolId: $schoolId,
        );
        return response()->json(['message' => 'Marketplace app installation revoked.']);
    }

    public function adminIndex()
    {
        return response()->json(['data' => MarketplaceApp::query()->withCount('installations')->latest('id')->get()]);
    }

    public function adminStore(Request $request)
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:marketplace_apps,slug'],
            'name' => ['required', 'string', 'max:160'],
            'publisher' => ['required', 'string', 'max:160'],
            'description' => ['required', 'string', 'max:5000'],
            'homepage_url' => ['nullable', 'url', 'max:500'],
            'capabilities' => ['nullable', 'array', 'max:30'],
            'status' => ['required', Rule::in(['draft', 'published', 'disabled'])],
        ]);
        abort_unless($data['status'] !== 'published', 422, 'Create the marketplace entry as a draft, then review and approve it before publication.');
        $data['created_by'] = $request->user()->id;
        $data['review_status'] = 'pending';
        $app = MarketplaceApp::create($data);
        ActivityLogService::log(module: 'marketplace', action: 'catalog_app_created', description: 'A marketplace app was added to the platform catalogue.', subject: $app, properties: ['slug' => $app->slug], schoolId: null);
        return response()->json(['data' => $app], 201);
    }

    public function adminUpdate(Request $request, MarketplaceApp $marketplaceApp)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:160'],
            'publisher' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'string', 'max:5000'],
            'homepage_url' => ['nullable', 'url', 'max:500'],
            'capabilities' => ['nullable', 'array', 'max:30'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'disabled'])],
            'review_status' => ['sometimes', Rule::in(['pending', 'approved', 'rejected'])],
            'security_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $nextStatus = $data['status'] ?? $marketplaceApp->status;
        $nextReviewStatus = $data['review_status'] ?? ($marketplaceApp->review_status ?: 'pending');
        abort_unless($nextStatus !== 'published' || $nextReviewStatus === 'approved', 422, 'A marketplace app must be reviewed and approved before publication.');

        if (array_key_exists('review_status', $data)) {
            $data['reviewed_by'] = $request->user()->id;
            $data['reviewed_at'] = now();
            if ($data['review_status'] === 'pending') {
                $data['reviewed_by'] = null;
                $data['reviewed_at'] = null;
            }
        }
        $marketplaceApp->update($data);
        ActivityLogService::log(module: 'marketplace', action: 'catalog_app_updated', description: 'A marketplace catalogue app was updated.', subject: $marketplaceApp, properties: ['changed_fields' => array_keys($data)], schoolId: null);
        return response()->json(['data' => $marketplaceApp->fresh()]);
    }

    public function adminDestroy(MarketplaceApp $marketplaceApp)
    {
        abort_if($marketplaceApp->installations()->exists(), 422, 'Installed marketplace apps cannot be deleted; disable the catalogue entry instead.');
        $id = $marketplaceApp->id;
        $marketplaceApp->delete();
        ActivityLogService::log(module: 'marketplace', action: 'catalog_app_deleted', description: 'A marketplace catalogue app was deleted.', properties: ['marketplace_app_id' => $id], schoolId: null);
        return response()->json(['message' => 'Marketplace app deleted.']);
    }

    private function resolveSchoolId(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'No active school context found.');
        return (int) $schoolId;
    }
}

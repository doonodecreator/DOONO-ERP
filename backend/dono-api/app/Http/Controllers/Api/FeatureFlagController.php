<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeatureFlag;
use App\Models\Organization;
use App\Models\School;
use App\Services\ActivityLogService;
use App\Services\FeatureFlagService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FeatureFlagController extends Controller
{
    public function __construct(private FeatureFlagService $flags) {}

    public function index(Request $request)
    {
        return response()->json([
            'data' => FeatureFlag::query()->latest()->paginate(min(max($request->integer('per_page', 50), 1), 100)),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $this->assertScope($data);
        abort_if($this->identityQuery($data)->exists(), 422, 'A feature flag with this key and scope already exists. Edit the existing flag instead.');
        $flag = FeatureFlag::create([...$data, 'created_by' => $request->user()->id]);
        $this->flags->forget($flag->key, $flag->scope_type, $flag->scope_id);
        ActivityLogService::log(module: 'feature_flags', action: 'created', description: "Feature flag {$flag->key} was created.", subject: $flag, properties: $flag->only(['key', 'scope_type', 'scope_id', 'is_enabled', 'rollout_percentage']));
        return response()->json(['data' => $flag], 201);
    }

    public function update(Request $request, FeatureFlag $featureFlag)
    {
        $before = $featureFlag->only(['key', 'name', 'description', 'scope_type', 'scope_id', 'is_enabled', 'rollout_percentage']);
        $data = $this->validated($request, true);
        $candidate = [...$featureFlag->toArray(), ...$data];
        $this->assertScope($candidate);
        abort_if($this->identityQuery($candidate)->whereKeyNot($featureFlag->id)->exists(), 422, 'A feature flag with this key and scope already exists. Edit the existing flag instead.');
        $featureFlag->update($data);
        $this->flags->forget($before['key'], $before['scope_type'], $before['scope_id']);
        $this->flags->forget($featureFlag->key, $featureFlag->scope_type, $featureFlag->scope_id);
        ActivityLogService::log(module: 'feature_flags', action: 'updated', description: "Feature flag {$featureFlag->key} was updated.", subject: $featureFlag, properties: ['before' => $before, 'after' => $featureFlag->only(array_keys($before))]);
        return response()->json(['data' => $featureFlag->fresh()]);
    }

    public function destroy(FeatureFlag $featureFlag)
    {
        $before = $featureFlag->only(['key', 'scope_type', 'scope_id']);
        $featureFlag->delete();
        $this->flags->forget($before['key'], $before['scope_type'], $before['scope_id']);
        ActivityLogService::log(module: 'feature_flags', action: 'deleted', description: "Feature flag {$before['key']} was deleted.", properties: $before);
        return response()->json(['message' => 'Feature flag deleted.']);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'key' => [$required, 'string', 'max:100', 'regex:/^[a-z0-9][a-z0-9_.-]*$/'],
            'name' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'scope_type' => [$required, Rule::in(['platform', 'organization', 'school'])],
            'scope_id' => ['nullable', 'integer'],
            'is_enabled' => [$partial ? 'sometimes' : 'boolean', 'boolean'],
            'rollout_percentage' => [$partial ? 'sometimes' : 'required', 'integer', 'min:0', 'max:100'],
        ]);
    }

    private function identityQuery(array $data)
    {
        return FeatureFlag::query()
            ->where('key', $data['key'])
            ->where('scope_type', $data['scope_type'])
            ->when(($data['scope_id'] ?? null) === null, fn ($query) => $query->whereNull('scope_id'), fn ($query) => $query->where('scope_id', $data['scope_id']));
    }

    private function assertScope(array $data): void
    {
        $type = $data['scope_type'] ?? null;
        $id = $data['scope_id'] ?? null;
        if ($type === 'platform') {
            abort_unless($id === null, 422, 'Platform flags must not have a scope ID.');
            return;
        }
        abort_unless($id, 422, 'An organization or school scope ID is required.');
        abort_unless($type === 'organization' ? Organization::whereKey($id)->exists() : School::whereKey($id)->exists(), 422, 'The selected feature-flag scope does not exist.');
    }
}

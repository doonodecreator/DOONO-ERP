<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolApiKey;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SchoolApiKeyController extends Controller
{
    private const ALLOWED_SCOPES = [
        'school.read',
        'students.read',
        'fees.read',
    ];

    public function __construct(private CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => SchoolApiKey::where('school_id', $schoolId)->latest()->paginate(min(max($request->integer('per_page', 20), 1), 100))]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'scopes' => ['required', 'array', 'min:1'],
            'scopes.*' => ['string', 'in:school.read,students.read,fees.read'],
            'expires_at' => ['nullable', 'date', 'after:today'],
        ]);
        $plain = 'dono_sk_'.Str::random(48);
        $key = SchoolApiKey::create([
            'school_id' => $schoolId,
            'created_by' => $request->user()->id,
            'name' => trim($data['name']),
            'key_prefix' => substr($plain, 0, 16),
            'key_hash' => hash('sha256', $plain),
            'scopes' => array_values(array_unique($data['scopes'])),
            'expires_at' => $data['expires_at'] ?? null,
        ]);
        ActivityLogService::log(module: 'integrations', action: 'api_key_created', description: 'A school API key was created.', subject: $key, schoolId: $schoolId, properties: ['scopes' => $key->scopes, 'expires_at' => $key->expires_at?->toIso8601String()]);
        return response()->json(['message' => 'API key created. Copy it now; it will not be shown again.', 'data' => ['key' => $plain, 'record' => $key]], 201);
    }

    public function revoke(Request $request, SchoolApiKey $schoolApiKey)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $schoolApiKey->school_id === $schoolId, 404);
        abort_if($schoolApiKey->revoked_at, 409, 'This API key has already been revoked.');
        $schoolApiKey->update(['revoked_at' => now()]);
        ActivityLogService::log(module: 'integrations', action: 'api_key_revoked', description: 'A school API key was revoked.', subject: $schoolApiKey, schoolId: $schoolId);
        return response()->json(['message' => 'API key revoked.']);
    }

    public static function allowedScopes(): array
    {
        return self::ALLOWED_SCOPES;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserPushToken;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    public function __construct(private CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $tokens = UserPushToken::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->get(['id', 'platform', 'last_used_at', 'revoked_at', 'created_at']);

        return response()->json(['data' => $tokens]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $data = $request->validate([
            'token' => ['required', 'string', 'min:20', 'max:4096'],
            'platform' => ['required', 'string', 'in:android,ios,web'],
        ]);

        $hash = hash('sha256', $data['token']);
        $token = UserPushToken::query()->updateOrCreate(
            [
                'school_id' => $schoolId,
                'user_id' => $request->user()->id,
                'token_hash' => $hash,
            ],
            [
                'token' => $data['token'],
                'platform' => $data['platform'],
                'revoked_at' => null,
                'last_used_at' => now(),
            ],
        );

        return response()->json([
            'message' => 'Push device registered for this school.',
            'data' => $token->only(['id', 'platform', 'last_used_at', 'created_at']),
        ], 201);
    }

    public function revoke(Request $request, UserPushToken $pushToken)
    {
        $schoolId = $this->resolveSchoolId($request);
        abort_unless((int) $pushToken->school_id === $schoolId && (int) $pushToken->user_id === (int) $request->user()->id, 404);

        $pushToken->forceFill(['revoked_at' => now()])->save();

        return response()->json(['message' => 'Push device revoked.']);
    }

    private function resolveSchoolId(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'No active school context found.');

        return (int) $schoolId;
    }
}

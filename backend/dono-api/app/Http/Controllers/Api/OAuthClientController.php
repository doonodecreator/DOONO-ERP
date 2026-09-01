<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Passport\Client;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Passport\ClientRepository;

class OAuthClientController extends Controller
{
    public const ALLOWED_SCOPES = [
        'school.read',
        'students.read',
        'fees.read',
        'fees.write',
        'attendance.write',
    ];

    public function __construct(private CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);

        $clients = Client::query()
            ->where('school_id', $schoolId)
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 25), 1), 100));

        return response()->json([
            'data' => $clients->getCollection()->map(fn (Client $client) => $this->summary($client))->values(),
            'meta' => [
                'current_page' => $clients->currentPage(),
                'last_page' => $clients->lastPage(),
                'per_page' => $clients->perPage(),
                'total' => $clients->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'scopes' => ['required', 'array', 'min:1'],
            'scopes.*' => ['string', 'distinct', 'in:'.implode(',', self::ALLOWED_SCOPES)],
        ]);

        $client = DB::transaction(function () use ($data, $schoolId, $request): Client {
            /** @var Client $client */
            $client = app(ClientRepository::class)->createClientCredentialsGrantClient($data['name']);
            $client->forceFill([
                'school_id' => $schoolId,
                'created_by' => $request->user()->id,
                'scopes' => array_values(array_unique($data['scopes'])),
                'revoked' => false,
            ])->save();

            ActivityLogService::log(
                module: 'oauth_clients',
                action: 'created',
                description: 'A school-scoped OAuth client was created with explicitly selected capabilities.',
                subject: $client,
                properties: ['client_id' => $client->getKey(), 'scopes' => $client->scopes],
                schoolId: $schoolId,
            );

            return $client->fresh();
        });

        return response()->json([
            'message' => 'OAuth client created. Copy the client secret now; it will not be shown again.',
            'data' => [
                ...$this->summary($client),
                'client_secret' => $client->plainSecret,
            ],
        ], 201);
    }

    public function revoke(Request $request, Client $oauthClient)
    {
        $schoolId = $this->resolveSchoolId($request);
        abort_unless((int) $oauthClient->school_id === $schoolId, 404);

        if (! $oauthClient->revoked) {
            $oauthClient->forceFill(['revoked' => true])->save();
            $oauthClient->tokens()->update(['revoked' => true]);

            ActivityLogService::log(
                module: 'oauth_clients',
                action: 'revoked',
                description: 'A school OAuth client was revoked together with its access tokens.',
                subject: $oauthClient,
                properties: ['client_id' => $oauthClient->getKey()],
                schoolId: $schoolId,
            );
        }

        return response()->json(['message' => 'OAuth client revoked.']);
    }

    private function resolveSchoolId(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'No active school context found.');

        return (int) $schoolId;
    }

    private function summary(Client $client): array
    {
        return [
            'id' => $client->getKey(),
            'client_id' => $client->getKey(),
            'name' => $client->name,
            'scopes' => is_array($client->scopes) ? array_values($client->scopes) : [],
            'grant_type' => 'client_credentials',
            'revoked' => (bool) $client->revoked,
            'created_at' => $client->created_at,
        ];
    }
}

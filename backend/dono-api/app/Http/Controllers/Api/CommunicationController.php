<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommunicationRequest;
use App\Http\Requests\UpdateCommunicationRequest;
use App\Models\Communication;
use App\Models\CommunicationRead;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommunicationController extends Controller
{
    public function __construct(private CurrentContextService $context) {}

    private const MANAGEMENT_ROLES = [
        'proprietor',
        'principal',
        'vice_principal_academic',
        'vice_principal_admin',
    ];
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $user = $request->user();
        $audiences = $this->audiencesFor($user, (int) $schoolId);

        $query = Communication::with([
                'sender:id,name,email',
                'recipient:id,name,email',
                'reads' => fn ($readQuery) => $readQuery->where('user_id', $user->id),
            ])
            ->where('school_id', $schoolId)
            ->where(function ($query) use ($user, $audiences) {
                $query->where(function ($published) use ($audiences) {
                    $published->where('is_published', true)
                        ->where(function ($visible) use ($audiences) {
                            $visible->where('audience', 'all')->orWhereIn('audience', $audiences);
                        });
                })
                ->orWhere('recipient_id', $user->id)
                ->orWhere('sender_id', $user->id);
            })
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->input('type')))
            ->latest('published_at')
            ->latest('id');

        $page = $query->paginate(min(max($request->integer('per_page', 25), 1), 100));
        $page->getCollection()->transform(function (Communication $communication) use ($user) {
            $communication->read_at = $communication->reads->first()?->read_at
                ?? ((int) $communication->recipient_id === (int) $user->id ? $communication->getRawOriginal('read_at') : null);
            $communication->unsetRelation('reads');
            return $communication;
        });

        return response()->json($page);
    }

    public function store(StoreCommunicationRequest $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validated();
        $recipientId = $data['recipient_id'] ?? null;

        if ($recipientId !== null) {
            abort_unless(
                DB::table('user_roles')->where('user_id', $recipientId)->where('school_id', $schoolId)->exists(),
                422,
                'The selected recipient does not belong to the active school.'
            );
        }

        $communication = Communication::create([
            ...$data,
            'school_id' => $schoolId,
            'sender_id' => $request->user()->id,
            'type' => $data['type'] ?? 'notice',
            'published_at' => ($data['is_published'] ?? true) ? now() : null,
            'is_published' => $data['is_published'] ?? true,
        ]);

        ActivityLogService::log(
            module: 'communication',
            action: 'created',
            description: "Communication {$communication->id} was created.",
            subject: $communication,
            schoolId: $schoolId,
            properties: ['type' => $communication->type, 'audience' => $communication->audience],
        );

        return response()->json(['data' => $communication->load(['sender:id,name,email', 'recipient:id,name,email'])], 201);
    }

    public function show(Request $request, Communication $communication)
    {
        $this->ensureSchool($request, $communication);

        return response()->json(['data' => $communication->load(['sender:id,name,email', 'recipient:id,name,email'])]);
    }

    public function update(UpdateCommunicationRequest $request, Communication $communication)
    {
        $schoolId = $this->ensureCanManage($request, $communication);
        $data = $request->validated();

        if (array_key_exists('recipient_id', $data) && $data['recipient_id'] !== null) {
            abort_unless(
                DB::table('user_roles')->where('user_id', $data['recipient_id'])->where('school_id', $schoolId)->exists(),
                422,
                'The selected recipient does not belong to the active school.'
            );
        }

        $communication->update($data);
        if (array_key_exists('is_published', $data)) {
            $communication->published_at = $data['is_published'] ? ($communication->published_at ?: now()) : null;
            $communication->save();
        }

        ActivityLogService::log(
            module: 'communication',
            action: 'updated',
            description: "Communication {$communication->id} was updated.",
            subject: $communication,
            schoolId: $schoolId,
            properties: ['changed_fields' => array_keys($data)],
        );

        return response()->json(['data' => $communication->fresh()->load(['sender:id,name,email', 'recipient:id,name,email'])]);
    }

    public function destroy(Request $request, Communication $communication)
    {
        $schoolId = $this->ensureCanManage($request, $communication);
        $id = $communication->id;
        $communication->delete();

        ActivityLogService::log(
            module: 'communication',
            action: 'deleted',
            description: "Communication {$id} was deleted.",
            schoolId: $schoolId,
            properties: ['communication_id' => $id],
        );

        return response()->json(['message' => 'Communication deleted successfully.']);
    }

    public function markRead(Request $request, Communication $communication)
    {
        $this->ensureSchool($request, $communication);
        abort_unless($communication->recipient_id === null || $communication->recipient_id === $request->user()->id, 403);
        CommunicationRead::updateOrCreate(
            [
                'communication_id' => $communication->id,
                'user_id' => $request->user()->id,
            ],
            [
                'school_id' => $communication->school_id,
                'read_at' => now(),
            ],
        );

        return response()->json(['data' => $communication->fresh()]);
    }

    private function ensureCanManage(Request $request, Communication $communication): int
    {
        $schoolId = $this->ensureSchool($request, $communication);
        $user = $request->user();

        if ($user->isSuperAdmin() || $user->hasRole('proprietor', $schoolId)) {
            return $schoolId;
        }

        $hasManagementRole = collect(self::MANAGEMENT_ROLES)
            ->contains(fn (string $role) => $user->hasRole($role, $schoolId));

        abort_unless($hasManagementRole || (int) $communication->sender_id === (int) $user->id, 403, 'You may only manage communications created by you unless you are school leadership.');

        return $schoolId;
    }

    private function ensureSchool(Request $request, Communication $communication): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $communication->school_id === $schoolId, 404);

        return $schoolId;
    }

    private function audiencesFor($user, int $schoolId): array
    {
        $roles = collect($this->context->resolve($user)['roles'] ?? [])
            ->filter(fn (array $role) => (int) ($role['school_id'] ?? 0) === $schoolId)
            ->pluck('slug')
            ->unique()
            ->values();

        $audiences = [];

        if ($roles->contains('parent')) {
            $audiences[] = 'parents';
        }

        if ($roles->contains('student')) {
            $audiences[] = 'students';
        }

        if ($roles->diff(['parent', 'student'])->isNotEmpty()) {
            $audiences[] = 'staff';
        }

        return $audiences ?: ['staff'];
    }
}

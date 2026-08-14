<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcademicSessionRequest;
use App\Http\Requests\UpdateAcademicSessionRequest;
use App\Http\Resources\AcademicSessionResource;
use App\Models\AcademicSession;
use App\Models\User;
use App\Services\CurrentContextService;
use Illuminate\Support\Facades\DB;

class AcademicSessionController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    private function currentSchoolId(User $user): ?int
    {
        return $this->context->currentSchool($user)?->id;
    }
    public function index()
    {
        $user = auth()->user();

        $query = AcademicSession::query();

        if (!$user->isSuperAdmin()) {
            $schoolId = $this->currentSchoolId($user);
            $query->where('school_id', $schoolId);
        }

        return AcademicSessionResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreAcademicSessionRequest $request)
    {
        $user = auth()->user();

        return DB::transaction(function () use ($request, $user) {
            $data = $request->validated();

            if (!$user->isSuperAdmin()) {
                $data['school_id'] = $this->currentSchoolId($user);
            }

            if (!empty($data['is_current']) && $data['is_current'] === true) {
                AcademicSession::where('school_id', $data['school_id'])
                    ->update(['is_current' => false]);
            }

            $session = AcademicSession::create($data);

            return (new AcademicSessionResource($session))
                ->response()
                ->setStatusCode(201);
        });
    }

    public function show(AcademicSession $academicSession)
    {
        $user = auth()->user();

        if (
            !$user->isSuperAdmin() &&
            $academicSession->school_id !== $this->currentSchoolId($user)
        ) {
            abort(403, 'Unauthorized access to this academic session.');
        }

        return new AcademicSessionResource($academicSession);
    }

    public function update(
        UpdateAcademicSessionRequest $request,
        AcademicSession $academicSession
    ) {
        $user = auth()->user();

        if (
            !$user->isSuperAdmin() &&
            $academicSession->school_id !== $this->currentSchoolId($user)
        ) {
            abort(403, 'Unauthorized access to update this academic session.');
        }

        return DB::transaction(function () use ($request, $academicSession) {
            $data = $request->validated();

            if (($data['is_current'] ?? false) === true) {
                AcademicSession::where('school_id', $academicSession->school_id)
                    ->where('id', '!=', $academicSession->id)
                    ->update(['is_current' => false]);
            }

            $academicSession->update($data);

            return new AcademicSessionResource($academicSession->fresh());
        });
    }

    public function destroy(AcademicSession $academicSession)
    {
        $user = auth()->user();

        if (
            !$user->isSuperAdmin() &&
            $academicSession->school_id !== $this->currentSchoolId($user)
        ) {
            abort(403, 'Unauthorized access to delete this academic session.');
        }

        $academicSession->delete();

        return response()->json([
            'message' => 'Academic session deleted successfully.',
        ]);
    }
}


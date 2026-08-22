<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTermRequest;
use App\Http\Requests\UpdateTermRequest;
use App\Http\Resources\TermResource;
use App\Models\AcademicSession;
use App\Models\Term;
use App\Models\User;
use App\Services\CurrentContextService;
use Illuminate\Support\Facades\DB;

class TermController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    public function index()
    {
        $user = auth()->user();

        $query = Term::with('academicSession');

        if (!$user->isSuperAdmin()) {

            $schoolId = $this->context->currentSchool($user)?->id;

            $query->whereHas('academicSession', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            });
        }

        return TermResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreTermRequest $request)
    {
        $user = auth()->user();

        return DB::transaction(function () use ($request, $user) {

            $academicSession = AcademicSession::findOrFail(
                $request->academic_session_id
            );

            if (
                !$user->isSuperAdmin() &&
                $academicSession->school_id !== $this->context->currentSchool($user)?->id
            ) {
                abort(403, 'You cannot create a term for another school.');
            }

            $data = $request->validated();

            if ($data['is_current']) {

                Term::where(
                    'academic_session_id',
                    $academicSession->id
                )->update([
                    'is_current' => false,
                ]);
            }

            $term = Term::create($data);

            return (new TermResource(
                $term->load('academicSession')
            ))
                ->response()
                ->setStatusCode(201);
        });
    }

    public function show(Term $term)
    {
        $user = auth()->user();

        $term->load('academicSession');

        if (
            !$user->isSuperAdmin() &&
            $term->academicSession->school_id !== $this->context->currentSchool($user)?->id
        ) {
            abort(403);
        }

        return new TermResource($term);
    }

    public function update(
        UpdateTermRequest $request,
        Term $term
    ) {
        $user = auth()->user();

        $term->load('academicSession');

        if (
            !$user->isSuperAdmin() &&
            $term->academicSession->school_id !== $this->context->currentSchool($user)?->id
        ) {
            abort(403);
        }

        return DB::transaction(function () use (
            $request,
            $term
        ) {

            $data = $request->validated();

            if (($data['is_current'] ?? false) === true) {

                Term::where(
                    'academic_session_id',
                    $term->academic_session_id
                )
                    ->where('id', '!=', $term->id)
                    ->update([
                        'is_current' => false,
                    ]);
            }

            $term->update($data);

            return new TermResource(
                $term->fresh()->load('academicSession')
            );
        });
    }

    public function destroy(Term $term)
    {
        $user = auth()->user();

        $term->load('academicSession');

        if (
            !$user->isSuperAdmin() &&
            $term->academicSession->school_id !== $this->context->currentSchool($user)?->id
        ) {
            abort(403);
        }

        $term->delete();

        return response()->json([
            'message' => 'Term deleted successfully.',
        ]);
    }
}

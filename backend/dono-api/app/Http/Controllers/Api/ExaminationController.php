<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreExaminationRequest;
use App\Http\Requests\UpdateExaminationRequest;
use App\Http\Resources\ExaminationResource;
use App\Models\Examination;
use Illuminate\Http\Request;

class ExaminationController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    private function currentContextSchoolId(Request $request): ?int
    {
        return $this->context->currentSchool($request->user())?->id;
    }
    public function index(Request $request)
    {
        $query = Examination::with([
            'school',
            'academicSession',
            'term',
        ]);

        if (! $request->user()->isSuperAdmin()) {
            $query->where(
                'school_id',
                $this->currentContextSchoolId($request)
            );
        }

        return ExaminationResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreExaminationRequest $request)
    {
        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
            $data['school_id'] =
                $this->currentContextSchoolId($request);
        }

        $examination = Examination::create($data);

        return (
            new ExaminationResource(
                $examination->load([
                    'school',
                    'academicSession',
                    'term',
                ])
            )
        )
        ->response()
        ->setStatusCode(201);
    }

    public function show(
        Request $request,
        Examination $examination
    ) {
        if (
            ! $request->user()->isSuperAdmin() &&
            $examination->school_id !=
            $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        return new ExaminationResource(
            $examination->load([
                'school',
                'academicSession',
                'term',
            ])
        );
    }

    public function update(
        UpdateExaminationRequest $request,
        Examination $examination
    ) {
        if (
            ! $request->user()->isSuperAdmin() &&
            $examination->school_id !=
            $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
            unset($data['school_id']);
        }

        $examination->update($data);

        return new ExaminationResource(
            $examination->load([
                'school',
                'academicSession',
                'term',
            ])
        );
    }

    public function destroy(
        Request $request,
        Examination $examination
    ) {
        if (
            ! $request->user()->isSuperAdmin() &&
            $examination->school_id !=
            $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $examination->delete();

        return response()->json([
            'message' => 'Examination deleted successfully.',
        ]);
    }
}

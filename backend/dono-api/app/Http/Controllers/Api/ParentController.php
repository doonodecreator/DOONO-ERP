<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreParentRequest;
use App\Http\Requests\UpdateParentRequest;
use App\Http\Resources\ParentResource;
use App\Models\ParentModel;
use Illuminate\Http\Request;

class ParentController extends Controller
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
        $query = ParentModel::with([
            'school',
            'students.class',
            'students.stream',
        ]);

        if (! $request->user()->isSuperAdmin()) {
            $query->where(
                'school_id',
                $this->currentContextSchoolId($request)
            );
        }

        return ParentResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreParentRequest $request)
    {
        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
            $data['school_id'] = $this->currentContextSchoolId($request);
        }

        $parent = ParentModel::create($data);

        return (new ParentResource(
            $parent->load([
                'school',
                'students.class',
            'students.stream',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, ParentModel $parent)
    {
        if (
            ! $request->user()->isSuperAdmin()
            && $parent->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        return new ParentResource(
            $parent->load([
                'school',
                'students.class',
            'students.stream',
            ])
        );
    }

    public function update(
        UpdateParentRequest $request,
        ParentModel $parent
    ) {
        if (
            ! $request->user()->isSuperAdmin()
            && $parent->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
            unset($data['school_id']);
        }

        $parent->update($data);

        return new ParentResource(
            $parent->load([
                'school',
                'students.class',
            'students.stream',
            ])
        );
    }

    public function destroy(Request $request, ParentModel $parent)
    {
        if (
            ! $request->user()->isSuperAdmin()
            && $parent->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $parent->delete();

        return response()->json([
            'message' => 'Parent deleted successfully.'
        ]);
    }
}

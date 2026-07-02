<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreParentRequest;
use App\Http\Requests\UpdateParentRequest;
use App\Http\Resources\ParentResource;
use App\Models\ParentModel;
use Illuminate\Http\Request;

class ParentController extends Controller
{
    public function index(Request $request)
    {
        $query = ParentModel::with([
            'school',
            'students',
        ]);

        if (! $request->user()->isSuperAdmin()) {
            $query->where(
                'school_id',
                $request->user()->currentSchoolId()
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
            $data['school_id'] = $request->user()->currentSchoolId();
        }

        $parent = ParentModel::create($data);

        return (new ParentResource(
            $parent->load([
                'school',
                'students',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, ParentModel $parent)
    {
        if (
            ! $request->user()->isSuperAdmin()
            && $parent->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        return new ParentResource(
            $parent->load([
                'school',
                'students',
            ])
        );
    }

    public function update(
        UpdateParentRequest $request,
        ParentModel $parent
    ) {
        if (
            ! $request->user()->isSuperAdmin()
            && $parent->school_id != $request->user()->currentSchoolId()
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
                'students',
            ])
        );
    }

    public function destroy(Request $request, ParentModel $parent)
    {
        if (
            ! $request->user()->isSuperAdmin()
            && $parent->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $parent->delete();

        return response()->json([
            'message' => 'Parent deleted successfully.'
        ]);
    }
}

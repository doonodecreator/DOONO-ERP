<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreParentStudentRequest;
use App\Http\Requests\UpdateParentStudentRequest;
use App\Http\Resources\ParentStudentResource;
use App\Models\ParentStudent;

class ParentStudentController extends Controller
{
    public function index()
    {
        return ParentStudentResource::collection(
            ParentStudent::with(['parent', 'student'])->latest()->get()
        );
    }

    public function store(StoreParentStudentRequest $request)
    {
        $parentStudent = ParentStudent::create($request->validated());

        return new ParentStudentResource(
            $parentStudent->load(['parent', 'student'])
        );
    }

    public function show(ParentStudent $parentStudent)
    {
        return new ParentStudentResource(
            $parentStudent->load(['parent', 'student'])
        );
    }

    public function update(UpdateParentStudentRequest $request, ParentStudent $parentStudent)
    {
        $parentStudent->update($request->validated());

        return new ParentStudentResource(
            $parentStudent->load(['parent', 'student'])
        );
    }

    public function destroy(ParentStudent $parentStudent)
    {
        $parentStudent->delete();

        return response()->json([
            'message' => 'Relationship deleted successfully.'
        ]);
    }
}

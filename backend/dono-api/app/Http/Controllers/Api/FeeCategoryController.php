<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeeCategoryRequest;
use App\Http\Requests\UpdateFeeCategoryRequest;
use App\Http\Resources\FeeCategoryResource;
use App\Models\FeeCategory;

class FeeCategoryController extends Controller
{
    public function index()
    {
        $schoolId = auth()->user()->school_id ?? null;

        return FeeCategoryResource::collection(
            FeeCategory::when($schoolId, function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->with('school')
            ->latest()
            ->paginate(10)
        );
    }

    public function store(StoreFeeCategoryRequest $request)
    {
        $data = $request->validated();
        if (auth()->check() && auth()->user()->school_id) {
            $data['school_id'] = auth()->user()->school_id;
        }

        $feeCategory = FeeCategory::create($data);

        return (new FeeCategoryResource(
            $feeCategory->load('school')
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(FeeCategory $feeCategory)
    {
        return new FeeCategoryResource(
            $feeCategory->load('school')
        );
    }

    public function update(UpdateFeeCategoryRequest $request, FeeCategory $feeCategory)
    {
        $feeCategory->update($request->validated());

        return new FeeCategoryResource(
            $feeCategory->load('school')
        );
    }

    public function destroy(FeeCategory $feeCategory)
    {
        $feeCategory->delete();

        return response()->json([
            'message' => 'Fee category deleted successfully.',
        ]);
    }
}

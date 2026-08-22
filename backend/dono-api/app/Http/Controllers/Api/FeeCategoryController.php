<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeeCategoryRequest;
use App\Http\Requests\UpdateFeeCategoryRequest;
use App\Http\Resources\FeeCategoryResource;
use App\Models\FeeCategory;
use Illuminate\Http\Request;

class FeeCategoryController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        return FeeCategoryResource::collection(
            FeeCategory::where('school_id', $schoolId)
                ->with('school')
                ->latest()
                ->paginate(10)
        );
    }

    public function store(StoreFeeCategoryRequest $request)
    {
        $data = $request->validated();
        $data['school_id'] = $this->requireSchool($request);

        $feeCategory = FeeCategory::create($data);

        return (new FeeCategoryResource($feeCategory->load('school')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, FeeCategory $feeCategory)
    {
        abort_unless((int) $feeCategory->school_id === $this->requireSchool($request), 404);

        return new FeeCategoryResource($feeCategory->load('school'));
    }

    public function update(UpdateFeeCategoryRequest $request, FeeCategory $feeCategory)
    {
        abort_unless((int) $feeCategory->school_id === $this->requireSchool($request), 404);

        $feeCategory->update($request->validated());

        return new FeeCategoryResource($feeCategory->load('school'));
    }

    public function destroy(Request $request, FeeCategory $feeCategory)
    {
        abort_unless((int) $feeCategory->school_id === $this->requireSchool($request), 404);

        $feeCategory->delete();

        return response()->json([
            'message' => 'Fee category deleted successfully.',
        ]);
    }
}

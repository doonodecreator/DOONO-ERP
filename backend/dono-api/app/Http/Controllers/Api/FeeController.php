<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeeRequest;
use App\Http\Requests\UpdateFeeRequest;
use App\Http\Resources\FeeResource;
use App\Models\Fee;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class FeeController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return FeeResource::collection(
            Fee::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
            ->with(['school', 'academicSession', 'term', 'division', 'class'])
            ->latest()
            ->paginate(10)
        );
    }

    public function store(StoreFeeRequest $request)
    {
        $data = $request->validated();
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        
        if ($schoolId) {
            $data['school_id'] = $schoolId;
        }

        $fee = Fee::create($data);

        return (new FeeResource($fee->load(['school', 'academicSession', 'term', 'division', 'class'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateFeeRequest $request, Fee $fee)
    {
        $fee->update($request->validated());
        return new FeeResource($fee->load(['school', 'academicSession', 'term', 'division', 'class']));
    }

    public function destroy(Fee $fee)
    {
        $fee->delete();
        return response()->json(['message' => 'Fee deleted successfully.']);
    }
}

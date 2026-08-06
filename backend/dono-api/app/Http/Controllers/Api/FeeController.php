<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeeRequest;
use App\Http\Requests\UpdateFeeRequest;
use App\Http\Resources\FeeResource;
use App\Models\Fee;

class FeeController extends Controller
{
    public function index()
    {
        $schoolId = auth()->user()->school_id ?? null;

        return FeeResource::collection(
            Fee::when($schoolId, function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->with([
                'school',
                'academicSession',
                'term',
                'division',
                'class',
            ])
            ->latest()
            ->paginate(10)
        );
    }

    public function store(StoreFeeRequest $request)
    {
        $data = $request->validated();
        if (auth()->check() && auth()->user()->school_id) {
            $data['school_id'] = auth()->user()->school_id;
        }

        $fee = Fee::create($data);

        return (new FeeResource(
            $fee->load([
                'school',
                'academicSession',
                'term',
                'division',
                'class',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Fee $fee)
    {
        return new FeeResource(
            $fee->load([
                'school',
                'academicSession',
                'term',
                'division',
                'class',
            ])
        );
    }

    public function update(UpdateFeeRequest $request, Fee $fee)
    {
        $fee->update($request->validated());

        return new FeeResource(
            $fee->load([
                'school',
                'academicSession',
                'term',
                'division',
                'class',
            ])
        );
    }

    public function destroy(Fee $fee)
    {
        $fee->delete();

        return response()->json([
            'message' => 'Fee deleted successfully.'
        ]);
    }
}

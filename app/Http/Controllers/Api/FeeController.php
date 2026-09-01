<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeeRequest;
use App\Http\Requests\UpdateFeeRequest;
use App\Http\Resources\FeeResource;
use App\Models\Fee;

class FeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return FeeResource::collection(
            Fee::with([
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

    /**
     * Store a newly created resource.
     */
    public function store(StoreFeeRequest $request)
    {
        $fee = Fee::create($request->validated());

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

    /**
     * Display the specified resource.
     */
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

    /**
     * Update the specified resource.
     */
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

    /**
     * Remove the specified resource.
     */
    public function destroy(Fee $fee)
    {
        $fee->delete();

        return response()->json([
            'message' => 'Fee deleted successfully.'
        ]);
    }
}

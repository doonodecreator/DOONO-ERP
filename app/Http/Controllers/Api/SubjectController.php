<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;

class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return SubjectResource::collection(
            Subject::with([
                'school',
                'division',
            ])
            ->latest()
            ->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreSubjectRequest $request)
    {
        $subject = Subject::create($request->validated());

        return (new SubjectResource(
            $subject->load([
                'school',
                'division',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Subject $subject)
    {
        return new SubjectResource(
            $subject->load([
                'school',
                'division',
                'classes',
            ])
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(UpdateSubjectRequest $request, Subject $subject)
    {
        $subject->update($request->validated());

        return new SubjectResource(
            $subject->load([
                'school',
                'division',
                'classes',
            ])
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Subject $subject)
    {
        $subject->delete();

        return response()->json([
            'message' => 'Subject deleted successfully.'
        ]);
    }
}

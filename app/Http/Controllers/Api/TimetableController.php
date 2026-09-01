<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTimetableRequest;
use App\Http\Requests\UpdateTimetableRequest;
use App\Http\Resources\TimetableResource;
use App\Models\Timetable;

class TimetableController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return TimetableResource::collection(
            Timetable::with([
                'school',
                'academicSession',
                'term',
                'division',
                'class',
                'stream',
                'subject',
                'staff',
            ])
            ->latest()
            ->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreTimetableRequest $request)
    {
        $timetable = Timetable::create($request->validated());

        return (new TimetableResource(
            $timetable->load([
                'school',
                'academicSession',
                'term',
                'division',
                'class',
                'stream',
                'subject',
                'staff',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Timetable $timetable)
    {
        return new TimetableResource(
            $timetable->load([
                'school',
                'academicSession',
                'term',
                'division',
                'class',
                'stream',
                'subject',
                'staff',
            ])
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(UpdateTimetableRequest $request, Timetable $timetable)
    {
        $timetable->update($request->validated());

        return new TimetableResource(
            $timetable->load([
                'school',
                'academicSession',
                'term',
                'division',
                'class',
                'stream',
                'subject',
                'staff',
            ])
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Timetable $timetable)
    {
        $timetable->delete();

        return response()->json([
            'message' => 'Timetable deleted successfully.',
        ]);
    }
}

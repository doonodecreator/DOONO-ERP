<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTimetableRequest;
use App\Http\Requests\UpdateTimetableRequest;
use App\Http\Resources\TimetableResource;
use App\Models\Timetable;
use App\Services\TimetableService;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function __construct(
        protected TimetableService $timetableService
    ) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $request->user()->school_id;

        $query = Timetable::with([
            'school', 'academicSession', 'term', 'division',
            'class', 'stream', 'subject', 'staff'
        ]);

        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        return TimetableResource::collection($query->latest()->paginate(15));
    }

    public function store(StoreTimetableRequest $request)
    {
        $data = $request->validated();
        $data['school_id'] = $request->attributes->get('current_school_id') ?? $request->user()->school_id;

        try {
            $timetable = $this->timetableService->createSchedule($data);

            return (new TimetableResource(
                $timetable->load(['school', 'academicSession', 'term', 'class', 'subject', 'staff'])
            ))->response()->setStatusCode(201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(Timetable $timetable)
    {
        $timetable->delete();

        return response()->json([
            'message' => 'Timetable period deleted successfully.',
        ]);
    }
}

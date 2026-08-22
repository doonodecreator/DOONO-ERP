<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreClassRequest;
use App\Http\Requests\UpdateClassRequest;
use App\Http\Resources\ClassResource;
use App\Models\ClassModel;
use App\Models\FormTeacherAssignment;
use App\Models\Staff;
use App\Models\Timetable;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    private function currentContextSchoolId(Request $request): ?int
    {
        return $this->context->currentSchool($request->user())?->id;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = ClassModel::with([
            'division',
            'streams',
        ])->orderBy('display_order');

        $schoolId = $this->currentContextSchoolId($request);

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->whereHas('division', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            });

            $staffId = Staff::query()
                ->where('school_id', $schoolId)
                ->where('user_id', $request->user()->id)
                ->value('id');

            if ($staffId && $request->user()->hasRole('teacher', $schoolId)) {
                $query->whereIn('id', Timetable::query()
                    ->where('school_id', $schoolId)
                    ->where('staff_id', $staffId)
                    ->where('entry_type', 'lesson')
                    ->pluck('class_id'));
            } elseif ($staffId && $request->user()->hasRole('form_teacher', $schoolId)) {
                $query->whereIn('id', FormTeacherAssignment::query()
                    ->where('school_id', $schoolId)
                    ->where('staff_id', $staffId)
                    ->where('is_active', true)
                    ->pluck('class_id'));
            }
        }

        return ClassResource::collection(
            $query->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreClassRequest $request)
    {
        $class = ClassModel::create(
            $request->validated()
        );

        return (
            new ClassResource(
                $class->load([
                    'division',
                    'streams',
                ])
            )
        )
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(
        Request $request,
        ClassModel $class
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $class->division->school_id !== $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        return new ClassResource(
            $class->load([
                'division',
                'streams',
            ])
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(
        UpdateClassRequest $request,
        ClassModel $class
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $class->division->school_id !== $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $class->update(
            $request->validated()
        );

        return new ClassResource(
            $class->load([
                'division',
                'streams',
            ])
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(
        Request $request,
        ClassModel $class
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $class->division->school_id !== $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $class->delete();

        return response()->json([
            'message' => 'Class deleted successfully.',
        ]);
    }
}

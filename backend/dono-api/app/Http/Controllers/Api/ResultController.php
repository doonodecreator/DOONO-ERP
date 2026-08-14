<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreResultRequest;
use App\Http\Requests\UpdateResultRequest;
use App\Http\Resources\ResultResource;
use App\Models\Result;
use Illuminate\Http\Request;

class ResultController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    private function currentContextSchoolId(Request $request): ?int
    {
        return $this->context->currentSchool($request->user())?->id;
    }
    public function index(Request $request)
    {
        $query = Result::with([
            'school',
            'studentEnrollment',
            'subject',
            'academicSession',
            'term',
        ]);

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->where('school_id', $this->currentContextSchoolId($request));
        }

        return ResultResource::collection(
            $query->latest()->paginate(15)
        );
    }

    public function store(StoreResultRequest $request)
    {
        $data = $request->validated();

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $data['school_id'] = $this->currentContextSchoolId($request);
        }

        $data['total_score'] = ($data['ca_score'] ?? 0) + ($data['exam_score'] ?? 0);
        $data['grade'] = $this->calculateGrade($data['total_score']);
        $data['remark'] = $this->calculateRemark($data['total_score']);

        $result = Result::create($data);

        return (new ResultResource(
            $result->load([
                'school',
                'studentEnrollment',
                'subject',
                'academicSession',
                'term',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, Result $result)
    {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $result->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized access to this result.');
        }

        return new ResultResource(
            $result->load([
                'school',
                'studentEnrollment',
                'subject',
                'academicSession',
                'term',
            ])
        );
    }

    public function update(UpdateResultRequest $request, Result $result)
    {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $result->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized action.');
        }

        if ($result->status === 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Published results cannot be edited.'
            ], 403);
        }

        $data = $request->validated();

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            unset($data['school_id']);
        }

        if (isset($data['ca_score']) || isset($data['exam_score'])) {
            $ca = $data['ca_score'] ?? $result->ca_score;
            $exam = $data['exam_score'] ?? $result->exam_score;

            $data['total_score'] = $ca + $exam;
            $data['grade'] = $this->calculateGrade($data['total_score']);
            $data['remark'] = $this->calculateRemark($data['total_score']);
        }

        $result->update($data);

        return new ResultResource(
            $result->load([
                'school',
                'studentEnrollment',
                'subject',
                'academicSession',
                'term',
            ])
        );
    }

    public function destroy(Request $request, Result $result)
    {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $result->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized action.');
        }

        if ($result->status === 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Published results cannot be deleted.'
            ], 403);
        }

        $result->delete();

        return response()->json([
            'success' => true,
            'message' => 'Result deleted successfully.'
        ]);
    }

    public function publish(Request $request, Result $result)
    {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $result->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized action.');
        }

        $result->update([
            'is_published' => true,
            'published_at' => now(),
            'published_by' => $request->user()->id,
            'status' => 'published',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Result published successfully.',
            'data' => $result,
        ]);
    }

    private function calculateGrade($score): string
    {
        if ($score >= 70) return 'A';
        if ($score >= 60) return 'B';
        if ($score >= 50) return 'C';
        if ($score >= 45) return 'D';
        if ($score >= 40) return 'E';

        return 'F';
    }

    private function calculateRemark($score): string
    {
        if ($score >= 70) return 'Excellent';
        if ($score >= 60) return 'Very Good';
        if ($score >= 50) return 'Good';
        if ($score >= 45) return 'Fair';
        if ($score >= 40) return 'Pass';

        return 'Fail';
    }
}


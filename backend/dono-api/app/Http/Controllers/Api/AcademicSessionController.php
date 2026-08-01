<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcademicSessionRequest;
use App\Http\Requests\UpdateAcademicSessionRequest;
use App\Http\Resources\AcademicSessionResource;
use App\Models\AcademicSession;
use Illuminate\Http\Request;

class AcademicSessionController extends Controller
{
    /**
     * Display a listing of academic sessions.
     */
    public function index(Request $request)
    {
        $query = AcademicSession::with([
            'school',
            'terms',
            'students',
        ]);

        /*
        |--------------------------------------------------------------------------
        | School Filtering
        |--------------------------------------------------------------------------
        */

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->where(
                'school_id',
                $request->user()->currentSchoolId()
            );
        }

        return AcademicSessionResource::collection(
            $query->latest()->paginate(10)
        );
    }

    /**
     * Store a newly created academic session.
     */
    public function store(StoreAcademicSessionRequest $request)
    {
        $data = $request->validated();

        /*
        |--------------------------------------------------------------------------
        | School Assignment
        |--------------------------------------------------------------------------
        */

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $data['school_id'] = $request->user()->currentSchoolId();
        }

        /*
        |--------------------------------------------------------------------------
        | Only One Current Session
        |--------------------------------------------------------------------------
        */

        if ($data['is_current']) {
            AcademicSession::where(
                'school_id',
                $data['school_id']
            )->update([
                'is_current' => false,
            ]);
        }

        $data['status'] = $data['is_current']
            ? 'active'
            : 'closed';

        $academicSession = AcademicSession::create($data);

        return (new AcademicSessionResource(
            $academicSession->load([
                'school',
                'terms',
                'students',
            ])
        ))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified academic session.
     */
    public function show(
        Request $request,
        AcademicSession $academicSession
    ) {
        return new AcademicSessionResource(
            $academicSession->load([
                'school',
                'terms',
                'students',
            ])
        );
    }

    /**
     * Update the specified academic session.
     */
    public function update(
        UpdateAcademicSessionRequest $request,
        AcademicSession $academicSession
    ) {
        $data = $request->validated();

        if (($data['is_current'] ?? false) === true) {

            AcademicSession::where(
                'school_id',
                $academicSession->school_id
            )
                ->where(
                    'id',
                    '!=',
                    $academicSession->id
                )
                ->update([
                    'is_current' => false,
                ]);
        }

        if (array_key_exists('is_current', $data)) {
            $data['status'] = $data['is_current']
                ? 'active'
                : 'closed';
        }

        $academicSession->update($data);

        return new AcademicSessionResource(
            $academicSession->fresh([
                'school',
                'terms',
                'students',
            ])
        );
    }

    /**
     * Remove the specified academic session.
     */
    public function destroy(
        Request $request,
        AcademicSession $academicSession
    ) {
        $academicSession->delete();

        return response()->json([
            'message' => 'Academic Session deleted successfully.',
        ]);
    }
}

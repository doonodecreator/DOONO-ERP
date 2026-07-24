<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTermRequest;
use App\Http\Requests\UpdateTermRequest;
use App\Http\Resources\TermResource;
use App\Models\Term;
use Illuminate\Support\Facades\DB;

class TermController extends Controller
{
    /**
     * Display a listing of terms.
     */
    public function index()
    {
        return TermResource::collection(
            Term::with('academicSession')
                ->latest()
                ->paginate(10)
        );
    }

    /**
     * Store a newly created term.
     */
    public function store(StoreTermRequest $request)
    {
        return DB::transaction(function () use ($request) {

            $data = $request->validated();

            if ($data['is_current']) {
                Term::where('academic_session_id', $data['academic_session_id'])
                    ->update(['is_current' => false]);
            }

            $term = Term::create($data);

            return (new TermResource(
                $term->load('academicSession')
            ))
            ->response()
            ->setStatusCode(201);

        });
    }

    /**
     * Display the specified term.
     */
    public function show(Term $term)
    {
        return new TermResource(
            $term->load('academicSession')
        );
    }

    /**
     * Update the specified term.
     */
    public function update(UpdateTermRequest $request, Term $term)
    {
        return DB::transaction(function () use ($request, $term) {

            $data = $request->validated();

            if (($data['is_current'] ?? false) === true) {
                Term::where('academic_session_id', $term->academic_session_id)
                    ->where('id', '!=', $term->id)
                    ->update(['is_current' => false]);
            }

            $term->update($data);

            return new TermResource(
                $term->load('academicSession')
            );

        });
    }

    /**
     * Remove the specified term.
     */
    public function destroy(Term $term)
    {
        $term->delete();

        return response()->json([
            'message' => 'Term deleted successfully.'
        ]);
    }
}

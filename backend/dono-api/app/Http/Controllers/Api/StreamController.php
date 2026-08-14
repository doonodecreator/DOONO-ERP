<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreStreamRequest;
use App\Http\Requests\UpdateStreamRequest;
use App\Http\Resources\StreamResource;
use App\Models\Stream;
use Illuminate\Http\Request;

class StreamController extends Controller
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
        $query = Stream::with('class')
            ->orderBy('display_order');

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->whereHas('class.division', function ($q) use ($request) {
                $q->where(
                    'school_id',
                    $this->currentContextSchoolId($request)
                );
            });
        }

        return StreamResource::collection(
            $query->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreStreamRequest $request)
    {
        $stream = Stream::create(
            $request->validated()
        );

        return (new StreamResource(
            $stream->load('class')
        ))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(
        Request $request,
        Stream $stream
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $stream->class->division->school_id !== $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        return new StreamResource(
            $stream->load('class')
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(
        UpdateStreamRequest $request,
        Stream $stream
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $stream->class->division->school_id !== $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $stream->update(
            $request->validated()
        );

        return new StreamResource(
            $stream->load('class')
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(
        Request $request,
        Stream $stream
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $stream->class->division->school_id !== $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $stream->delete();

        return response()->json([
            'message' => 'Stream deleted successfully.',
        ]);
    }
}

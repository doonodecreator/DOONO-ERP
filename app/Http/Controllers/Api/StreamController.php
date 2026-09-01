<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStreamRequest;
use App\Http\Requests\UpdateStreamRequest;
use App\Http\Resources\StreamResource;
use App\Models\Stream;

class StreamController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return StreamResource::collection(
            Stream::with('class')
                ->orderBy('display_order')
                ->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreStreamRequest $request)
    {
        $stream = Stream::create($request->validated());

        return (new StreamResource(
            $stream->load('class')
        ))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Stream $stream)
    {
        return new StreamResource(
            $stream->load('class')
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(UpdateStreamRequest $request, Stream $stream)
    {
        $stream->update($request->validated());

        return new StreamResource(
            $stream->load('class')
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Stream $stream)
    {
        $stream->delete();

        return response()->json([
            'message' => 'Stream deleted successfully.'
        ]);
    }
}

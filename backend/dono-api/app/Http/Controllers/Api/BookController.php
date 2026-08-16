<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return response()->json(
            Book::when($schoolId, function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })->latest()->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'isbn' => 'nullable|string|max:50',
            'category' => 'required|string|max:100',
            'total_copies' => 'required|integer|min:1',
        ]);

        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        if ($schoolId) {
            $validated['school_id'] = $schoolId;
        }
        $validated['available_copies'] = $validated['total_copies'];

        $book = Book::create($validated);

        return response()->json([
            'message' => 'Book added successfully.',
            'data' => $book
        ], 201);
    }

    public function show(Book $book)
    {
        return response()->json($book);
    }

    public function update(Request $request, Book $book)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'author' => 'sometimes|string|max:255',
            'isbn' => 'nullable|string|max:50',
            'category' => 'sometimes|string|max:100',
            'total_copies' => 'sometimes|integer|min:1',
        ]);

        $book->update($validated);

        return response()->json([
            'message' => 'Book updated successfully.',
            'data' => $book
        ]);
    }

    public function destroy(Book $book)
    {
        $book->delete();

        return response()->json([
            'message' => 'Book deleted successfully.'
        ]);
    }
}

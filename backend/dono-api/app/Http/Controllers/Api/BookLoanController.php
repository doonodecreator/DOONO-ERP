<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookLoan;
use Illuminate\Http\Request;

class BookLoanController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;

        return response()->json(
            BookLoan::when($schoolId, function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->with(['book', 'student', 'issuer'])
            ->latest()
            ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
            'student_id' => 'required|exists:students,id',
            'due_date' => 'required|date|after:today',
        ]);

        $book = Book::findOrFail($validated['book_id']);

        if ($book->available_copies < 1) {
            return response()->json(['message' => 'No available copies left for loan.'], 422);
        }

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $validated['borrowed_date'] = now()->toDateString();
        $validated['issued_by'] = auth()->id();
        $validated['status'] = 'Borrowed';

        $loan = BookLoan::create($validated);
        $book->decrement('available_copies');

        return response()->json([
            'message' => 'Book issued successfully.',
            'data' => $loan->load(['book', 'student'])
        ], 201);
    }

    public function update(Request $request, BookLoan $bookLoan)
    {
        $validated = $request->validate([
            'status' => 'required|in:Returned,Lost',
            'fine_amount' => 'nullable|numeric|min:0',
        ]);

        if ($validated['status'] === 'Returned' && $bookLoan->status === 'Borrowed') {
            $bookLoan->book->increment('available_copies');
        }

        $bookLoan->update([
            'status' => $validated['status'],
            'returned_date' => $validated['status'] === 'Returned' ? now()->toDateString() : $bookLoan->returned_date,
            'fine_amount' => $validated['fine_amount'] ?? $bookLoan->fine_amount,
        ]);

        return response()->json([
            'message' => 'Book loan status updated successfully.',
            'data' => $bookLoan->load(['book', 'student'])
        ]);
    }
}


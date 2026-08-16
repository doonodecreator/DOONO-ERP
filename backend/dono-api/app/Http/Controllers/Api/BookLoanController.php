<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookLoan;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class BookLoanController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return response()->json(
            BookLoan::whereHas('student', function ($query) use ($schoolId) {
                if ($schoolId) {
                    $query->where('school_id', $schoolId);
                }
            })
            ->with(['book', 'student'])
            ->latest()
            ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
            'student_id' => 'required|exists:students,id',
            'due_date' => 'required|date|after:today',
        ]);

        $validated['borrowed_date'] = now();
        $validated['status'] = 'Borrowed';

        $loan = BookLoan::create($validated);

        return response()->json([
            'message' => 'Book issued successfully.',
            'data' => $loan->load(['book', 'student'])
        ], 201);
    }

    public function update(Request $request, BookLoan $bookLoan)
    {
        $validated = $request->validate([
            'status' => 'required|in:Borrowed,Returned,Lost',
            'fine_amount' => 'nullable|numeric|min:0',
        ]);

        $bookLoan->update($validated);

        return response()->json([
            'message' => 'Book loan updated successfully.',
            'data' => $bookLoan->load(['book', 'student'])
        ]);
    }

    public function destroy(BookLoan $bookLoan)
    {
        $bookLoan->delete();

        return response()->json([
            'message' => 'Book loan record deleted.'
        ]);
    }
}

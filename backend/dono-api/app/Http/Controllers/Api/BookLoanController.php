<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookLoan;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookLoanController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    private function librarySchoolId(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'Select an active school before managing library loans.');

        return (int) $schoolId;
    }

    private function scoped(Request $request, BookLoan $loan): BookLoan
    {
        abort_unless((int) $loan->school_id === $this->librarySchoolId($request), 404, 'Book loan not found.');

        return $loan;
    }

    public function index(Request $request)
    {
        $schoolId = $this->librarySchoolId($request);

        return response()->json(
            BookLoan::query()
                ->where('school_id', $schoolId)
                ->with(['book', 'student'])
                ->latest()
                ->paginate(min(max($request->integer('per_page', 10), 1), 100))
        );
    }

    public function store(Request $request)
    {
        $schoolId = $this->librarySchoolId($request);
        $validated = $request->validate([
            'book_id' => ['required', 'integer', 'exists:books,id'],
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'due_date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $loan = DB::transaction(function () use ($schoolId, $validated, $request): BookLoan {
            $book = Book::query()->whereKey($validated['book_id'])->where('school_id', $schoolId)->lockForUpdate()->firstOrFail();
            $student = Student::query()->whereKey($validated['student_id'])->where('school_id', $schoolId)->whereRaw('LOWER(status) = ?', ['active'])->firstOrFail();
            abort_unless(StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists(), 422, 'The student must have an active enrollment before receiving a library loan.');
            abort_unless((int) $book->available_copies > 0, 422, 'This book has no available copies. Return a copy before issuing another loan.');
            abort_if(BookLoan::query()->where('school_id', $schoolId)->where('book_id', $book->id)->where('student_id', $student->id)->where('status', 'Borrowed')->exists(), 422, 'This student already has an active loan for this book.');

            $loan = BookLoan::create([
                'school_id' => $schoolId,
                'book_id' => $book->id,
                'student_id' => $student->id,
                'borrowed_date' => today(),
                'due_date' => $validated['due_date'],
                'status' => 'Borrowed',
                'fine_amount' => 0,
                'issued_by' => $request->user()->id,
            ]);
            $book->decrement('available_copies');

            return $loan;
        });

        ActivityLogService::log('library', 'loan_issued', 'A library book was issued to a student.', $loan, ['book_id' => $loan->book_id, 'student_id' => $loan->student_id, 'due_date' => $loan->due_date?->toDateString()], $schoolId);

        return response()->json(['message' => 'Book issued successfully.', 'data' => $loan->load(['book', 'student'])], 201);
    }

    public function update(Request $request, BookLoan $bookLoan)
    {
        $loan = $this->scoped($request, $bookLoan);
        $validated = $request->validate([
            'status' => ['required', 'in:Borrowed,Returned,Lost'],
            'fine_amount' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
        ]);
        $before = $loan->only(['status', 'returned_date', 'fine_amount']);

        DB::transaction(function () use ($loan, $validated): void {
            $lockedLoan = BookLoan::query()->whereKey($loan->id)->lockForUpdate()->firstOrFail();
            $book = Book::query()->whereKey($lockedLoan->book_id)->where('school_id', $lockedLoan->school_id)->lockForUpdate()->firstOrFail();
            $nextStatus = $validated['status'];
            abort_unless($lockedLoan->status === 'Borrowed' || $nextStatus === $lockedLoan->status, 422, 'A completed or lost loan cannot be changed back to an active loan.');

            $updates = ['status' => $nextStatus, 'fine_amount' => $validated['fine_amount'] ?? $lockedLoan->fine_amount];
            if ($lockedLoan->status === 'Borrowed' && $nextStatus === 'Returned') {
                $updates['returned_date'] = today();
                $book->increment('available_copies');
            } elseif ($lockedLoan->status === 'Borrowed' && $nextStatus === 'Lost') {
                $updates['returned_date'] = null;
            } elseif ($nextStatus === 'Returned') {
                $updates['returned_date'] = $lockedLoan->returned_date ?: today();
            }
            $lockedLoan->update($updates);
        });

        $after = $loan->fresh()->only(['status', 'returned_date', 'fine_amount']);
        ActivityLogService::log('library', 'loan_updated', 'A library loan status or fine was updated.', $loan, ['before' => $before, 'after' => $after], (int) $loan->school_id);

        return response()->json(['message' => 'Book loan updated successfully.', 'data' => $loan->fresh()->load(['book', 'student'])]);
    }

    public function destroy(Request $request, BookLoan $bookLoan)
    {
        $this->scoped($request, $bookLoan);

        return response()->json(['message' => 'Loan history is retained for accountability. Mark the loan Returned or Lost instead of deleting it.'], 422);
    }
}

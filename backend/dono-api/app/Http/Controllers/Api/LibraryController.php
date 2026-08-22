<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookLoan;
use App\Models\Student;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class LibraryController extends Controller
{
    public function __construct(private readonly CurrentContextService $context) {}

    public function workspace(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $books = Book::query()->where('school_id', $schoolId)->orderBy('title')->get();
        $loans = BookLoan::query()->where('school_id', $schoolId)->with(['book', 'student'])->latest('borrowed_date')->get();
        $loanCounts = $loans->groupBy('student_id')->map->count();
        $members = Student::query()->where('school_id', $schoolId)->whereRaw('LOWER(status) = ?', ['active'])->orderBy('first_name')->get()->map(fn ($student) => [
            'id' => $student->id,
            'name' => $student->full_name,
            'admission_number' => $student->admission_number,
            'class' => $student->class?->name,
            'loan_count' => (int) ($loanCounts[$student->id] ?? 0),
        ])->values();

        return response()->json([
            'data' => [
                'books' => $books->map(fn ($book) => [
                    'id' => $book->id,
                    'title' => $book->title,
                    'author' => $book->author,
                    'category' => $book->category,
                    'total_copies' => (int) $book->total_copies,
                    'available_copies' => (int) $book->available_copies,
                ])->values(),
                'loans' => $loans->map(fn ($loan) => [
                    'id' => $loan->id,
                    'book' => $loan->book?->title,
                    'student' => $loan->student?->full_name,
                    'borrowed_date' => $loan->borrowed_date?->toDateString(),
                    'due_date' => $loan->due_date?->toDateString(),
                    'returned_date' => $loan->returned_date?->toDateString(),
                    'status' => $loan->status,
                    'fine_amount' => (float) $loan->fine_amount,
                ])->values(),
                'members' => $members,
                'reports' => [
                    'book_titles' => $books->count(),
                    'total_copies' => (int) $books->sum('total_copies'),
                    'available_copies' => (int) $books->sum('available_copies'),
                    'active_loans' => $loans->where('status', '!=', 'returned')->count(),
                    'overdue_loans' => $loans->filter(fn ($loan) => $loan->status !== 'returned' && $loan->due_date?->isPast())->count(),
                    'fines' => (float) $loans->sum(fn ($loan) => (float) $loan->fine_amount),
                ],
            ],
        ]);
    }

    public function studentLibrary(Request $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        $student = Student::query()
            ->where('user_id', $request->user()->id)
            ->when($schoolId, fn ($query) => $query->where('school_id', $schoolId))
            ->first();

        abort_unless($student && $schoolId, 404, 'Student library profile not found.');

        $books = Book::query()->where('school_id', $schoolId)->orderBy('title')->get();
        $loans = BookLoan::query()
            ->where('school_id', $schoolId)
            ->where('student_id', $student->id)
            ->with('book')
            ->latest('borrowed_date')
            ->get();

        return response()->json([
            'data' => [
                'books' => $books->map(fn ($book) => [
                    'id' => $book->id,
                    'title' => $book->title,
                    'author' => $book->author,
                    'category' => $book->category,
                    'available_copies' => (int) $book->available_copies,
                ])->values(),
                'my_loans' => $loans->map(fn ($loan) => [
                    'id' => $loan->id,
                    'book' => $loan->book?->title,
                    'borrowed_date' => $loan->borrowed_date?->toDateString(),
                    'due_date' => $loan->due_date?->toDateString(),
                    'returned_date' => $loan->returned_date?->toDateString(),
                    'status' => $loan->status,
                    'fine_amount' => (float) $loan->fine_amount,
                ])->values(),
            ],
        ]);
    }
}

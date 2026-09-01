<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookLoan;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    private function librarySchoolId(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'Select an active school before managing the library.');

        return (int) $schoolId;
    }

    private function scoped(Request $request, Book $book): Book
    {
        abort_unless((int) $book->school_id === $this->librarySchoolId($request), 404, 'Book not found.');

        return $book;
    }

    public function index(Request $request)
    {
        return response()->json(
            Book::query()
                ->where('school_id', $this->librarySchoolId($request))
                ->withCount(['loans as active_loan_count' => fn ($query) => $query->where('status', 'Borrowed')])
                ->latest()
                ->paginate(min(max($request->integer('per_page', 10), 1), 100))
        );
    }

    public function store(Request $request)
    {
        $schoolId = $this->librarySchoolId($request);
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:50'],
            'category' => ['required', 'string', 'max:100'],
            'total_copies' => ['required', 'integer', 'min:1', 'max:100000'],
        ]);
        $validated['school_id'] = $schoolId;
        $validated['available_copies'] = $validated['total_copies'];

        $book = Book::create($validated);
        ActivityLogService::log('library', 'book_created', 'A library book was added to the school catalog.', $book, ['after' => $book->only(['title', 'author', 'isbn', 'category', 'total_copies', 'available_copies'])], $schoolId);

        return response()->json(['message' => 'Book added successfully.', 'data' => $book], 201);
    }

    public function show(Request $request, Book $book)
    {
        return response()->json($this->scoped($request, $book)->loadCount(['loans as active_loan_count' => fn ($query) => $query->where('status', 'Borrowed')]));
    }

    public function update(Request $request, Book $book)
    {
        $book = $this->scoped($request, $book);
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'author' => ['sometimes', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:50'],
            'category' => ['sometimes', 'string', 'max:100'],
            'total_copies' => ['sometimes', 'integer', 'min:1', 'max:100000'],
        ]);

        $before = $book->only(['title', 'author', 'isbn', 'category', 'total_copies', 'available_copies']);
        DB::transaction(function () use ($book, $validated): void {
            $lockedBook = Book::query()->whereKey($book->id)->lockForUpdate()->firstOrFail();
            if (array_key_exists('total_copies', $validated)) {
                $borrowed = BookLoan::query()->where('book_id', $lockedBook->id)->where('status', 'Borrowed')->count();
                abort_unless($validated['total_copies'] >= $borrowed, 422, "Total copies cannot be lower than the {$borrowed} currently borrowed copy(ies).");
                $validated['available_copies'] = $validated['total_copies'] - $borrowed;
            }
            $lockedBook->update($validated);
        });

        ActivityLogService::log('library', 'book_updated', 'A library book was updated.', $book, ['before' => $before, 'after' => $book->fresh()->only(['title', 'author', 'isbn', 'category', 'total_copies', 'available_copies'])], (int) $book->school_id);

        return response()->json(['message' => 'Book updated successfully.', 'data' => $book->fresh()]);
    }

    public function destroy(Request $request, Book $book)
    {
        $book = $this->scoped($request, $book);
        abort_if(BookLoan::query()->where('book_id', $book->id)->exists(), 422, 'Book history cannot be deleted while loan records exist. Update the catalog record instead.');
        $before = $book->only(['title', 'author', 'isbn', 'category', 'total_copies', 'available_copies']);
        $book->delete();
        ActivityLogService::log('library', 'book_deleted', 'A library book was removed from the school catalog.', $book, ['before' => $before], (int) $book->school_id);

        return response()->json(['message' => 'Book deleted successfully.']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookReservation;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookReservationController extends Controller
{
    public function studentIndex(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $student = Student::query()->where('school_id', $schoolId)->where('user_id', $request->user()->id)->firstOrFail();
        abort_unless(StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists(), 403, 'Library reservations are available only for an actively enrolled student.');
        return response()->json(['data' => BookReservation::query()->where('school_id', $schoolId)->where('student_id', $student->id)->with('book:id,title')->latest('requested_at')->get()]);
    }

    public function studentStore(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $student = Student::query()->where('school_id', $schoolId)->where('user_id', $request->user()->id)->firstOrFail();
        abort_unless(StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists(), 403, 'Library reservations are available only for an actively enrolled student.');
        $data = $request->validate(['book_id' => ['required', 'integer', 'exists:books,id'], 'notes' => ['nullable', 'string', 'max:2000']]);
        $book = Book::query()->whereKey($data['book_id'])->where('school_id', $schoolId)->firstOrFail();
        abort_if(BookReservation::query()->where('school_id', $schoolId)->where('book_id', $book->id)->where('student_id', $student->id)->where('status', 'pending')->exists(), 422, 'You already have a pending reservation for this book.');
        $reservation = BookReservation::create([...$data, 'school_id' => $schoolId, 'student_id' => $student->id, 'requested_at' => now(), 'status' => 'pending']);
        ActivityLogService::log('library', 'student_reservation_created', 'A student created a library reservation from the student portal.', $reservation, ['book_id' => $book->id], $schoolId);
        return response()->json(['message' => 'Reservation created successfully.', 'data' => $reservation->load('book')], 201);
    }

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => BookReservation::query()->where('school_id', $schoolId)->with(['book:id,title', 'student:id,first_name,last_name,surname,admission_number'])->latest('requested_at')->paginate(min(max($request->integer('per_page', 30), 1), 100))]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate([
            'book_id' => ['required', 'integer', 'exists:books,id'],
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $book = Book::query()->whereKey($validated['book_id'])->where('school_id', $schoolId)->firstOrFail();
        $student = Student::query()->whereKey($validated['student_id'])->where('school_id', $schoolId)->whereRaw('LOWER(status) = ?', ['active'])->firstOrFail();
        abort_unless(StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists(), 422, 'The student must have an active enrollment before creating a library reservation.');
        abort_if(BookReservation::query()->where('school_id', $schoolId)->where('book_id', $book->id)->where('student_id', $student->id)->where('status', 'pending')->exists(), 422, 'This student already has a pending reservation for this book.');

        $reservation = BookReservation::create([...$validated, 'school_id' => $schoolId, 'requested_at' => now(), 'status' => 'pending']);
        ActivityLogService::log('library', 'reservation_created', 'A library reservation was created.', $reservation, ['book_id' => $book->id, 'student_id' => $student->id], $schoolId);
        return response()->json(['message' => 'Book reservation created successfully.', 'data' => $reservation->load(['book', 'student'])], 201);
    }

    public function show(Request $request, BookReservation $bookReservation)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $bookReservation->school_id === $schoolId, 404, 'Reservation not found.');
        return response()->json(['data' => $bookReservation->load(['book', 'student', 'fulfilledBy:id,name'])]);
    }

    public function update(Request $request, BookReservation $bookReservation)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $bookReservation->school_id === $schoolId, 404, 'Reservation not found.');
        $validated = $request->validate(['status' => ['required', 'in:pending,fulfilled,cancelled,expired'], 'notes' => ['nullable', 'string', 'max:2000']]);
        $before = $bookReservation->only(['status', 'fulfilled_at', 'fulfilled_by', 'notes']);
        DB::transaction(function () use ($bookReservation, $validated, $request): void {
            $reservation = BookReservation::query()->whereKey($bookReservation->id)->lockForUpdate()->firstOrFail();
            abort_unless($reservation->status === 'pending' || $validated['status'] === $reservation->status, 422, 'Only pending reservations can be changed.');
            $updates = ['status' => $validated['status'], 'notes' => $validated['notes'] ?? $reservation->notes];
            if ($validated['status'] === 'fulfilled') {
                $updates['fulfilled_at'] = now();
                $updates['fulfilled_by'] = $request->user()->id;
            }
            $reservation->update($updates);
        });
        ActivityLogService::log('library', 'reservation_updated', 'A library reservation was updated.', $bookReservation, ['before' => $before, 'after' => $bookReservation->fresh()->only(['status', 'fulfilled_at', 'fulfilled_by', 'notes'])], $schoolId);
        return response()->json(['message' => 'Reservation updated successfully.', 'data' => $bookReservation->fresh()->load(['book', 'student', 'fulfilledBy:id,name'])]);
    }

    public function destroy(Request $request, BookReservation $bookReservation)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $bookReservation->school_id === $schoolId, 404, 'Reservation not found.');
        return response()->json(['message' => 'Reservation history is retained. Cancel the reservation instead of deleting it.'], 422);
    }
}

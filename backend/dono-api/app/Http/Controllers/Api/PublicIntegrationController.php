<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\Student;
use App\Models\Staff;
use App\Models\StudentEnrollment;
use App\Services\ActivityLogService;
use App\Services\AttendanceService;
use App\Services\Finance\PaymentService;
use App\Http\Resources\FeePaymentResource;
use Illuminate\Http\Request;

class PublicIntegrationController extends Controller
{
    public function capabilities()
    {
        return response()->json(['data' => [
            'version' => 'v1',
            'enabled' => (bool) config('dono.oauth.enabled'),
            'authentication' => [
                'token_endpoint' => '/oauth/token',
                'grant_type' => 'client_credentials',
                'required_header' => 'Authorization: Bearer <access-token>',
            ],
            'scopes' => [
                'school.read' => ['method' => 'GET', 'path' => '/api/v1/oauth/integration/school'],
                'students.read' => ['method' => 'GET', 'path' => '/api/v1/oauth/integration/students'],
                'fees.read' => ['method' => 'GET', 'path' => '/api/v1/oauth/integration/student-fees'],
                'fees.write' => ['method' => 'POST', 'path' => '/api/v1/oauth/integration/fee-payments', 'requires' => ['Idempotency-Key']],
                'attendance.write' => ['method' => 'POST', 'path' => '/api/v1/oauth/integration/attendance', 'requires' => ['Idempotency-Key']],
            ],
            'tenant_boundary' => 'The OAuth client determines the school; caller-supplied school IDs are not accepted as an authority boundary.',
        ]]);
    }

    public function school(Request $request)
    {
        $school = $this->schoolFromKey($request);
        return response()->json(['data' => [
            'id' => $school->id,
            'name' => $school->name,
            'short_name' => $school->short_name,
            'school_type' => $school->school_type,
            'address' => $school->address,
            'phone' => $school->phone,
            'email' => $school->email,
        ]]);
    }

    public function fees(Request $request)
    {
        $school = $this->schoolFromKey($request);
        $fees = \App\Models\StudentFee::query()
            ->where('school_id', $school->id)
            ->with(['studentEnrollment.student:id,first_name,middle_name,last_name,admission_number'])
            ->withSum('payments as total_paid', 'amount_paid')
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 50), 1), 200));
        $fees->getCollection()->transform(fn ($fee) => [
            'id' => $fee->id,
            'invoice_number' => $fee->invoice_number,
            'student' => $fee->studentEnrollment?->student?->only(['id', 'first_name', 'middle_name', 'last_name', 'admission_number']),
            'amount' => $fee->amount,
            'discount' => $fee->discount,
            'amount_due' => $fee->amount_due,
            'total_paid' => $fee->total_paid,
            'due_date' => $fee->due_date?->toDateString(),
            'status' => $fee->status,
        ]);
        return response()->json($fees);
    }

    public function students(Request $request)
    {
        $school = $this->schoolFromKey($request);
        $students = Student::query()->where('school_id', $school->id)->where('status', 'Active')->with(['class:id,name', 'stream:id,name'])->orderBy('last_name')->orderBy('first_name')->paginate(min(max($request->integer('per_page', 50), 1), 200));
        $students->getCollection()->transform(fn (Student $student) => [
            'id' => $student->id,
            'admission_number' => $student->admission_number,
            'full_name' => $student->full_name,
            'class' => $student->class?->name,
            'stream' => $student->stream?->name,
            'status' => $student->status,
        ]);
        return response()->json($students);
    }

    public function recordPayment(Request $request, PaymentService $paymentService)
    {
        $schoolId = (int) $request->attributes->get('oauth_client_school_id');
        abort_unless($schoolId > 0, 401, 'The OAuth client has no school context.');

        $data = $request->validate([
            'student_fee_id' => ['required', 'integer'],
            'amount_paid' => ['required', 'numeric', 'gt:0'],
            'payment_date' => ['nullable', 'date'],
            'payment_method' => ['required', 'string', 'in:Cash,Bank Transfer,POS,Cheque,Online'],
            'transaction_reference' => ['required', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $payment = $paymentService->recordIntegrationPayment($data, $schoolId);

        ActivityLogService::log(
            module: 'oauth_integration',
            action: 'fee_payment_recorded',
            description: 'A fee payment was recorded through an authorized school OAuth integration.',
            subject: $payment,
            properties: [
                'client_id' => $request->attributes->get('oauth_client')?->getKey(),
                'student_fee_id' => $payment->student_fee_id,
                'amount_paid' => $payment->amount_paid,
                'transaction_reference' => $payment->transaction_reference,
                'idempotency_key_present' => $request->headers->has('Idempotency-Key'),
            ],
            schoolId: $schoolId,
        );

        return response()->json([
            'success' => true,
            'message' => 'Fee payment recorded successfully.',
            'data' => (new FeePaymentResource($payment))->toArray($request),
            'idempotent_replay' => (bool) $request->attributes->get('idempotency_replay', false),
        ], 201);
    }

    public function recordAttendance(Request $request, AttendanceService $attendanceService)
    {
        $schoolId = (int) $request->attributes->get('oauth_client_school_id');
        abort_unless($schoolId > 0, 401, 'The OAuth client has no school context.');

        $data = $request->validate([
            'academic_session_id' => ['required', 'integer', 'exists:academic_sessions,id'],
            'term_id' => ['required', 'integer', 'exists:terms,id'],
            'attendance_date' => ['required', 'date'],
            'recorded_by_staff_id' => ['required', 'integer'],
            'records' => ['required', 'array', 'min:1', 'max:500'],
            'records.*.student_enrollment_id' => ['required', 'integer'],
            'records.*.status' => ['required', 'string', 'in:Present,Absent,Late,Excused'],
            'records.*.remarks' => ['nullable', 'string', 'max:255'],
            'correction_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $staff = Staff::query()
            ->where('school_id', $schoolId)
            ->whereKey($data['recorded_by_staff_id'])
            ->whereIn('employment_status', ['active', 'Active', 'on leave', 'on_leave'])
            ->first();
        abort_unless($staff, 422, 'The recording staff member is not active in this school.');

        $enrollmentIds = collect($data['records'])->pluck('student_enrollment_id')->unique()->values();
        $enrollments = StudentEnrollment::query()
            ->where('school_id', $schoolId)
            ->where('academic_session_id', $data['academic_session_id'])
            ->where('term_id', $data['term_id'])
            ->whereIn('id', $enrollmentIds)
            ->get(['id', 'class_id', 'stream_id']);
        abort_unless($enrollments->count() === $enrollmentIds->count(), 422, 'Every enrollment must belong to this school, session, and term.');
        abort_unless($enrollments->pluck('class_id')->filter()->unique()->count() === 1, 422, 'An attendance sync request must contain one class only.');

        $saved = $attendanceService->recordClassAttendance(
            schoolId: $schoolId,
            sessionId: (int) $data['academic_session_id'],
            termId: (int) $data['term_id'],
            date: $data['attendance_date'],
            recordedByStaffId: (int) $staff->id,
            records: $data['records'],
            correctionReason: $data['correction_reason'] ?? 'Attendance synchronized through an authorized school OAuth integration.',
        );

        ActivityLogService::log(
            module: 'oauth_integration',
            action: 'attendance_synced',
            description: 'Attendance was synchronized through a school-scoped OAuth client.',
            properties: [
                'client_id' => $request->attributes->get('oauth_client')?->getKey(),
                'staff_id' => $staff->id,
                'record_count' => $saved->count(),
                'idempotency_key_present' => $request->headers->has('Idempotency-Key'),
            ],
            schoolId: $schoolId,
        );

        return response()->json([
            'success' => true,
            'message' => 'Attendance synchronized successfully.',
            'data' => ['count' => $saved->count(), 'attendance_ids' => $saved->pluck('id')->values()],
        ]);
    }

    private function schoolFromKey(Request $request): School
    {
        $schoolId = (int) ($request->attributes->get('oauth_client_school_id')
            ?? $request->attributes->get('school_api_key_school_id'));
        abort_unless($schoolId > 0, 401, 'The API key has no school context.');
        return School::query()->select(['id', 'name', 'short_name', 'school_type', 'address', 'phone', 'email'])->findOrFail($schoolId);
    }
}

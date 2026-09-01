<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentFeeRequest;
use App\Http\Requests\UpdateStudentFeeRequest;
use App\Http\Resources\StudentFeeResource;
use App\Models\AcademicSession;
use App\Models\FeeCategory;
use App\Models\StudentEnrollment;
use App\Models\StudentFee;
use App\Models\Term;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class StudentFeeController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'Select an active school before viewing invoices.');

        return StudentFeeResource::collection(
            StudentFee::when($schoolId, function ($query) use ($schoolId) {
                $query->whereHas('studentEnrollment.student', fn($q) => $q->where('school_id', $schoolId));
            })
            ->with([
                'studentEnrollment.student',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])->latest()->paginate(10)
        );
    }

    public function store(StoreStudentFeeRequest $request)
    {
        $data = $request->validated();
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'Select an active school before creating an invoice.');
        $enrollment = StudentEnrollment::query()
            ->whereKey($data['student_enrollment_id'])
            ->where('school_id', $schoolId)
            ->where('status', 'Active')
            ->first();
        abort_unless($enrollment, 422, 'The selected enrollment is not an active placement in the current school.');
        abort_unless((int) $enrollment->academic_session_id === (int) $data['academic_session_id'] && (int) $enrollment->term_id === (int) $data['term_id'], 422, 'The invoice session and term must match the student enrollment.');
        abort_unless(FeeCategory::query()->whereKey($data['fee_category_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected fee category does not belong to the current school.');
        abort_unless(AcademicSession::query()->whereKey($data['academic_session_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected academic session does not belong to the current school.');
        abort_unless(Term::query()->whereKey($data['term_id'])->where('academic_session_id', $data['academic_session_id'])->exists(), 422, 'The selected term does not belong to the selected academic session.');
        abort_unless(! StudentFee::query()
            ->where('student_enrollment_id', $enrollment->id)
            ->where('fee_category_id', $data['fee_category_id'])
            ->where('academic_session_id', $data['academic_session_id'])
            ->where('term_id', $data['term_id'])
            ->exists(), 422, 'A matching invoice already exists for this student, fee category, session, and term.');
        $studentFee = DB::transaction(function () use ($data, $schoolId): StudentFee {
            $settings = DB::table('school_settings')->where('school_id', $schoolId)->lockForUpdate()->first();
            if (! $settings) {
                DB::table('school_settings')->insert(['school_id' => $schoolId, 'invoice_prefix' => 'INV', 'next_invoice_number' => 1, 'created_at' => now(), 'updated_at' => now()]);
                $settings = DB::table('school_settings')->where('school_id', $schoolId)->lockForUpdate()->first();
            }
            $prefix = strtoupper(trim((string) ($settings->invoice_prefix ?: 'INV')));
            $sequence = max(1, (int) ($settings->next_invoice_number ?: 1));
            $invoiceNumber = $prefix.'-'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
            DB::table('school_settings')->where('school_id', $schoolId)->update(['next_invoice_number' => $sequence + 1, 'updated_at' => now()]);
            return StudentFee::create([...$data, 'school_id' => $schoolId, 'invoice_number' => $invoiceNumber]);
        });

        ActivityLogService::log(
            module: 'student_fees',
            action: 'created',
            description: 'A student invoice was created.',
            subject: $studentFee,
            schoolId: $schoolId,
            properties: ['invoice_number' => $studentFee->invoice_number, 'amount_due' => $studentFee->amount_due],
        );

        return (new StudentFeeResource(
            $studentFee->load([
                'studentEnrollment.student',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, StudentFee $studentFee)
    {
        $this->assertBelongsToCurrentSchool($request, $studentFee);

        return new StudentFeeResource(
            $studentFee->load([
                'studentEnrollment.student',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])
        );
    }

    public function update(UpdateStudentFeeRequest $request, StudentFee $studentFee)
    {
        $this->assertBelongsToCurrentSchool($request, $studentFee);
        $data = $request->validated();
        $protectedFields = array_intersect(
            array_keys($data),
            ['student_enrollment_id', 'fee_category_id', 'academic_session_id', 'term_id', 'amount', 'discount', 'amount_due', 'status'],
        );
        abort_unless($protectedFields === [], 422, 'Invoice identity and financial values are immutable here. Use the approved discount or payment-reversal workflow for corrections.');
        $allowedData = array_intersect_key($data, array_flip(['due_date', 'remarks']));
        $before = $studentFee->only(['due_date', 'remarks']);
        $studentFee->update($allowedData);
        $schoolId = $this->context->currentSchool($request->user())?->id;
        ActivityLogService::log(
            module: 'student_fees',
            action: 'updated',
            description: 'Invoice administrative details were updated.',
            subject: $studentFee,
            schoolId: (int) $schoolId,
            properties: ['before' => $before, 'after' => $studentFee->fresh()->only(['due_date', 'remarks'])],
        );

        return new StudentFeeResource(
            $studentFee->load([
                'studentEnrollment.student',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])
        );
    }

    public function destroy(Request $request, StudentFee $studentFee)
    {
        $this->assertBelongsToCurrentSchool($request, $studentFee);
        abort_if($studentFee->payments()->exists(), 422, 'This invoice has payment history and cannot be deleted. Reverse an erroneous payment instead.');
        $schoolId = $this->context->currentSchool($request->user())?->id;
        $invoiceNumber = $studentFee->invoice_number;
        $studentFee->delete();
        ActivityLogService::log(
            module: 'student_fees',
            action: 'deleted',
            description: 'An unpaid student invoice was deleted.',
            schoolId: (int) $schoolId,
            properties: ['invoice_number' => $invoiceNumber, 'student_fee_id' => $studentFee->id],
        );

        return response()->json([
            'message' => 'Student fee deleted successfully.',
        ]);
    }

    private function assertBelongsToCurrentSchool(Request $request, StudentFee $studentFee): void
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        $studentFee->loadMissing('studentEnrollment.student');

        if ((int) $studentFee->studentEnrollment?->student?->school_id !== (int) $schoolId) {
            throw new NotFoundHttpException('Invoice not found in the current school.');
        }
    }
}

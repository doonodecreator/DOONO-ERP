<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateFeeInvoicesRequest;
use App\Http\Requests\StoreFeeRequest;
use App\Http\Requests\UpdateFeeRequest;
use App\Http\Resources\FeeResource;
use App\Models\Fee;
use App\Services\CurrentContextService;
use App\Services\ActivityLogService;
use App\Services\Finance\FeeService;
use Illuminate\Http\Request;

class FeeController extends Controller
{
    public function __construct(
        protected CurrentContextService $context,
        protected FeeService $feeService,
    ) {}

    public function index(Request $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;

        return FeeResource::collection(
            Fee::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
            ->with(['school', 'academicSession', 'term', 'division', 'class'])
            ->latest()
            ->paginate(10)
        );
    }

    public function generateInvoices(GenerateFeeInvoicesRequest $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'Select an active school before generating invoices.');

        $invoices = $this->feeService->generateClassInvoices(
            (int) $schoolId,
            (int) $request->validated('fee_id'),
            (int) $request->validated('class_id'),
            (int) $request->validated('academic_session_id'),
            (int) $request->validated('term_id'),
            $request->validated('due_date'),
        );

        ActivityLogService::log(
            module: 'fees',
            action: 'invoices_generated',
            description: 'Class invoices were generated from configured fee structures.',
            schoolId: (int) $schoolId,
            properties: [
                'fee_id' => (int) $request->validated('fee_id'),
                'class_id' => (int) $request->validated('class_id'),
                'academic_session_id' => (int) $request->validated('academic_session_id'),
                'term_id' => (int) $request->validated('term_id'),
                'invoice_count' => $invoices->count(),
            ],
        );

        return response()->json([
            'success' => true,
            'message' => $invoices->count() > 0
                ? $invoices->count().' invoice(s) are ready for the active students in this class.'
                : 'No new invoices were created. Confirm that active fee structures and active enrollments exist for this class, session, and term.',
            'data' => [
                'fee_id' => (int) $request->validated('fee_id'),
                'invoice_count' => $invoices->count(),
                'class_id' => (int) $request->validated('class_id'),
                'academic_session_id' => (int) $request->validated('academic_session_id'),
                'term_id' => (int) $request->validated('term_id'),
            ],
        ]);
    }

    public function store(StoreFeeRequest $request)
    {
        $data = $request->validated();
        $schoolId = $this->context->currentSchool($request->user())?->id;
        
        if ($schoolId) {
            $data['school_id'] = $schoolId;
        }

        $fee = Fee::create($data);

        return (new FeeResource($fee->load(['school', 'academicSession', 'term', 'division', 'class'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateFeeRequest $request, Fee $fee)
    {
        $fee->update($request->validated());
        return new FeeResource($fee->load(['school', 'academicSession', 'term', 'division', 'class']));
    }

    public function destroy(Fee $fee)
    {
        $fee->delete();
        return response()->json(['message' => 'Fee deleted successfully.']);
    }
}

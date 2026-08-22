<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollEntry;
use App\Models\Staff;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PayrollEntryController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $query = PayrollEntry::with(['staff:id,school_id,first_name,middle_name,last_name,staff_number', 'creator:id,name'])
            ->where('school_id', $schoolId)
            ->when($request->filled('pay_period'), fn ($query) => $query->where('pay_period', $request->input('pay_period')))
            ->latest('pay_period')->latest();

        return response()->json($query->paginate(min(max($request->integer('per_page', 25), 1), 100)));
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'staff_id' => ['required', 'integer', 'exists:staff,id'],
            'pay_period' => ['required', 'date_format:Y-m'],
            'gross_amount' => ['required', 'numeric', 'min:0'],
            'deductions' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(['Draft', 'Approved', 'Paid'])],
        ]);
        abort_unless(Staff::whereKey($data['staff_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected staff member does not belong to the active school.');
        $data['deductions'] = $data['deductions'] ?? 0;
        $data['net_amount'] = max(0, (float) $data['gross_amount'] - (float) $data['deductions']);
        $data['paid_at'] = ($data['status'] ?? 'Draft') === 'Paid' ? now() : null;
        $entry = PayrollEntry::create([...$data, 'school_id' => $schoolId, 'created_by' => $request->user()->id]);
        ActivityLogService::log(module: 'payroll', action: 'created', description: 'Payroll entry created.', subject: $entry, schoolId: $schoolId);
        return response()->json(['data' => $entry->load(['staff:id,school_id,first_name,middle_name,last_name,staff_number', 'creator:id,name'])], 201);
    }

    public function update(Request $request, PayrollEntry $payrollEntry)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $payrollEntry->school_id === $schoolId, 404);
        $data = $request->validate([
            'gross_amount' => ['sometimes', 'numeric', 'min:0'],
            'deductions' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(['Draft', 'Approved', 'Paid'])],
        ]);
        $gross = (float) ($data['gross_amount'] ?? $payrollEntry->gross_amount);
        $deductions = (float) ($data['deductions'] ?? $payrollEntry->deductions);
        $payrollEntry->update([...$data, 'net_amount' => max(0, $gross - $deductions), 'paid_at' => (($data['status'] ?? $payrollEntry->status) === 'Paid') ? ($payrollEntry->paid_at ?: now()) : null]);
        ActivityLogService::log(module: 'payroll', action: 'updated', description: 'Payroll entry updated.', subject: $payrollEntry, schoolId: $schoolId, properties: ['changed_fields' => array_keys($data)]);
        return response()->json(['data' => $payrollEntry->fresh()->load(['staff:id,school_id,first_name,middle_name,last_name,staff_number', 'creator:id,name'])]);
    }

    public function destroy(Request $request, PayrollEntry $payrollEntry)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $payrollEntry->school_id === $schoolId, 404);
        $payrollEntry->delete();
        ActivityLogService::log(module: 'payroll', action: 'deleted', description: 'Payroll entry deleted.', schoolId: $schoolId, properties: ['payroll_id' => $payrollEntry->id]);
        return response()->json(['message' => 'Payroll entry deleted successfully.']);
    }
}

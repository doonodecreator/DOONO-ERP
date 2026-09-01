<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollEntry;
use App\Models\Staff;
use App\Models\StaffContract;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class PayrollEntryController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $query = PayrollEntry::query()
            ->with(['staff:id,school_id,first_name,middle_name,last_name,staff_number', 'contract:id,contract_number,base_salary,allowances,currency,start_date,end_date', 'creator:id,name'])
            ->where('school_id', $schoolId)
            ->when($request->filled('pay_period'), fn ($query) => $query->where('pay_period', $request->input('pay_period')))
            ->latest('pay_period')->latest();

        return response()->json($query->paginate(min(max($request->integer('per_page', 25), 1), 100)));
    }

    public function options(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => [
            'staff' => Staff::query()->where('school_id', $schoolId)->whereIn('employment_status', ['active', 'Active'])->orderBy('last_name')->orderBy('first_name')->get(['id', 'school_id', 'first_name', 'middle_name', 'last_name', 'staff_number', 'designation']),
            'contracts' => StaffContract::query()->where('school_id', $schoolId)->where('status', 'active')->latest('start_date')->get(['id', 'school_id', 'staff_id', 'contract_number', 'base_salary', 'allowances', 'currency', 'start_date', 'end_date']),
        ]]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'staff_id' => ['required', 'integer', 'exists:staff,id'],
            'contract_id' => ['nullable', 'integer', 'exists:staff_contracts,id'],
            'pay_period' => ['required', 'date_format:Y-m'],
            'gross_amount' => ['nullable', 'numeric', 'min:0', 'required_without:contract_id'],
            'deductions' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(['Draft', 'Approved', 'Paid'])],
        ]);
        abort_unless(Staff::whereKey($data['staff_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected staff member does not belong to the active school.');
        $contract = ! empty($data['contract_id']) ? StaffContract::query()->whereKey($data['contract_id'])->where('school_id', $schoolId)->where('staff_id', $data['staff_id'])->where('status', 'active')->firstOrFail() : null;
        if ($contract) {
            $periodStart = Carbon::createFromFormat('Y-m-d', $data['pay_period'].'-01')->startOfDay();
            abort_unless($contract->start_date <= $periodStart && (! $contract->end_date || $contract->end_date >= $periodStart), 422, 'The selected contract is not effective for this pay period.');
            $data['allowances'] = $contract->allowances ?: [];
            $data['gross_amount'] = (float) $contract->base_salary + (float) collect($data['allowances'])->sum(fn ($allowance) => (float) ($allowance['amount'] ?? 0));
        } else {
            $data['allowances'] = [];
        }
        $data['deductions'] = $data['deductions'] ?? 0;
        $data['net_amount'] = max(0, (float) $data['gross_amount'] - (float) $data['deductions']);
        $data['paid_at'] = ($data['status'] ?? 'Draft') === 'Paid' ? now() : null;
        $entry = PayrollEntry::create([...$data, 'school_id' => $schoolId, 'created_by' => $request->user()->id]);
        ActivityLogService::log(module: 'payroll', action: 'created', description: 'Payroll entry created.', subject: $entry, schoolId: $schoolId);
        return response()->json(['data' => $entry->load(['staff:id,school_id,first_name,middle_name,last_name,staff_number', 'contract:id,contract_number,base_salary,allowances,currency,start_date,end_date', 'creator:id,name'])], 201);
    }

    public function update(Request $request, PayrollEntry $payrollEntry)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $payrollEntry->school_id === $schoolId, 404);
        $data = $request->validate([
            'gross_amount' => ['sometimes', 'numeric', 'min:0'],
            'deductions' => ['sometimes', 'numeric', 'min:0'],
            'contract_id' => ['sometimes', 'nullable', 'integer', 'exists:staff_contracts,id'],
            'status' => ['sometimes', Rule::in(['Draft', 'Approved', 'Paid'])],
        ]);
        if (array_key_exists('contract_id', $data) && $data['contract_id']) {
            $contract = StaffContract::query()->whereKey($data['contract_id'])->where('school_id', $schoolId)->where('staff_id', $payrollEntry->staff_id)->where('status', 'active')->firstOrFail();
            $data['allowances'] = $contract->allowances ?: [];
            $data['gross_amount'] = (float) $contract->base_salary + (float) collect($data['allowances'])->sum(fn ($allowance) => (float) ($allowance['amount'] ?? 0));
        }
        $gross = (float) ($data['gross_amount'] ?? $payrollEntry->gross_amount);
        $deductions = (float) ($data['deductions'] ?? $payrollEntry->deductions);
        $payrollEntry->update([...$data, 'net_amount' => max(0, $gross - $deductions), 'paid_at' => (($data['status'] ?? $payrollEntry->status) === 'Paid') ? ($payrollEntry->paid_at ?: now()) : null]);
        ActivityLogService::log(module: 'payroll', action: 'updated', description: 'Payroll entry updated.', subject: $payrollEntry, schoolId: $schoolId, properties: ['changed_fields' => array_keys($data)]);
        return response()->json(['data' => $payrollEntry->fresh()->load(['staff:id,school_id,first_name,middle_name,last_name,staff_number', 'contract:id,contract_number,base_salary,allowances,currency,start_date,end_date', 'creator:id,name'])]);
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

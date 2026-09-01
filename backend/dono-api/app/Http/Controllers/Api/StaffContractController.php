<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\StaffContract;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class StaffContractController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => StaffContract::query()->where('school_id', $schoolId)->when($request->integer('staff_id'), fn ($query, $staffId) => $query->where('staff_id', $staffId))->with(['staff:id,school_id,first_name,middle_name,last_name,staff_number,designation', 'creator:id,name'])->latest('start_date')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'staff_id' => ['required', 'integer', 'exists:staff,id'],
            'contract_number' => ['required', 'string', 'max:80'],
            'employment_type' => ['required', 'in:full_time,part_time,contract,temporary'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'base_salary' => ['required', 'numeric', 'min:0', 'max:1000000000'],
            'allowances' => ['nullable', 'array'],
            'allowances.*.name' => ['required_with:allowances', 'string', 'max:100'],
            'allowances.*.amount' => ['required_with:allowances', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'status' => ['sometimes', 'in:active,suspended,ended'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
        $staff = Staff::query()->whereKey($data['staff_id'])->where('school_id', $schoolId)->firstOrFail();
        $contract = StaffContract::create([...$data, 'school_id' => $schoolId, 'created_by' => $request->user()->id]);
        ActivityLogService::log('payroll', 'staff_contract_created', 'A staff employment contract was created.', $contract, ['staff_id' => $staff->id, 'contract_number' => $contract->contract_number], $schoolId);
        return response()->json(['message' => 'Staff contract created successfully.', 'data' => $contract->load(['staff', 'creator:id,name'])], 201);
    }

    public function show(Request $request, StaffContract $staffContract)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $staffContract->school_id === $schoolId, 404, 'Staff contract not found.');
        return response()->json(['data' => $staffContract->load(['staff', 'creator:id,name'])]);
    }

    public function update(Request $request, StaffContract $staffContract)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $staffContract->school_id === $schoolId, 404, 'Staff contract not found.');
        $data = $request->validate([
            'employment_type' => ['sometimes', 'in:full_time,part_time,contract,temporary'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['nullable', 'date'],
            'base_salary' => ['sometimes', 'numeric', 'min:0', 'max:1000000000'],
            'allowances' => ['nullable', 'array'],
            'allowances.*.name' => ['required_with:allowances', 'string', 'max:100'],
            'allowances.*.amount' => ['required_with:allowances', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'status' => ['sometimes', 'in:active,suspended,ended'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
        $start = $data['start_date'] ?? $staffContract->start_date?->toDateString();
        if (! empty($data['end_date'])) {
            abort_unless($data['end_date'] >= $start, 422, 'The contract end date must be on or after its start date.');
        }
        $before = $staffContract->only(['employment_type', 'start_date', 'end_date', 'base_salary', 'allowances', 'currency', 'status', 'notes']);
        $staffContract->update($data);
        ActivityLogService::log('payroll', 'staff_contract_updated', 'A staff employment contract was updated.', $staffContract, ['before' => $before, 'after' => $staffContract->fresh()->only(array_keys($before))], $schoolId);
        return response()->json(['message' => 'Staff contract updated successfully.', 'data' => $staffContract->fresh()->load(['staff', 'creator:id,name'])]);
    }

    public function destroy(Request $request, StaffContract $staffContract)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $staffContract->school_id === $schoolId, 404, 'Staff contract not found.');
        return response()->json(['message' => 'Employment history is retained. Mark the contract ended instead of deleting it.'], 422);
    }
}

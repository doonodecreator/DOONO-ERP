<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransportLog;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class TransportLogController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => TransportLog::query()->where('school_id', $schoolId)->when($request->query('type'), fn ($query, $type) => $query->where('type', $type))->with('vehicle')->latest('service_date')->paginate(20)]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'vehicle_id' => ['required', 'integer'],
            'type' => ['required', 'in:fuel,maintenance'],
            'amount' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'odometer' => ['nullable', 'integer', 'min:0'],
            'service_date' => ['required', 'date'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:open,completed'],
        ]);
        abort_unless(Vehicle::whereKey($data['vehicle_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected vehicle does not belong to the current school.');
        $log = TransportLog::create([...$data, 'school_id' => $schoolId, 'recorded_by' => $request->user()->id, 'status' => $data['status'] ?? 'completed']);
        return response()->json(['data' => $log->load('vehicle')], 201);
    }

    public function update(Request $request, TransportLog $transportLog)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $transportLog->school_id === $schoolId, 404, 'Transport record not found.');
        $data = $request->validate(['amount' => ['sometimes', 'numeric', 'min:0'], 'quantity' => ['sometimes', 'nullable', 'numeric', 'min:0'], 'odometer' => ['sometimes', 'nullable', 'integer', 'min:0'], 'service_date' => ['sometimes', 'date'], 'description' => ['sometimes', 'nullable', 'string'], 'status' => ['sometimes', 'in:open,completed']]);
        $transportLog->update($data);
        return response()->json(['data' => $transportLog->fresh()->load('vehicle')]);
    }

    public function destroy(Request $request, TransportLog $transportLog)
    {
        abort_unless((int) $transportLog->school_id === $this->requireSchool($request), 404, 'Transport record not found.');
        $transportLog->delete();
        return response()->json(['message' => 'Transport record deleted successfully.']);
    }
}

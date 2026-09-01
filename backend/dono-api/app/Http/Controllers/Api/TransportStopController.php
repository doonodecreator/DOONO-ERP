<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransportRoute;
use App\Models\TransportStop;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class TransportStopController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $routeId = $request->integer('transport_route_id');
        if ($routeId) {
            abort_unless(TransportRoute::whereKey($routeId)->where('school_id', $schoolId)->exists(), 404, 'Transport route not found.');
        }

        return response()->json(['data' => TransportStop::query()->where('school_id', $schoolId)->when($routeId, fn ($query) => $query->where('transport_route_id', $routeId))->orderBy('transport_route_id')->orderBy('sequence')->paginate(min(max($request->integer('per_page', 30), 1), 100))]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate([
            'transport_route_id' => ['required', 'integer', 'exists:transport_routes,id'],
            'stop_name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'pickup_time' => ['nullable', 'date_format:H:i'],
            'dropoff_time' => ['nullable', 'date_format:H:i'],
            'sequence' => ['required', 'integer', 'min:1', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        abort_unless(TransportRoute::whereKey($validated['transport_route_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected route does not belong to this school.');
        $stop = TransportStop::create([...$validated, 'school_id' => $schoolId]);
        ActivityLogService::log('transport', 'stop_created', 'A transport route stop was created.', $stop, ['after' => $stop->only(['transport_route_id', 'stop_name', 'sequence', 'is_active'])], $schoolId);

        return response()->json(['message' => 'Transport stop created successfully.', 'data' => $stop], 201);
    }

    public function show(Request $request, TransportStop $transportStop)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $transportStop->school_id === $schoolId, 404, 'Transport stop not found.');

        return response()->json(['data' => $transportStop]);
    }

    public function update(Request $request, TransportStop $transportStop)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $transportStop->school_id === $schoolId, 404, 'Transport stop not found.');
        $validated = $request->validate([
            'stop_name' => ['sometimes', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'pickup_time' => ['nullable', 'date_format:H:i'],
            'dropoff_time' => ['nullable', 'date_format:H:i'],
            'sequence' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $before = $transportStop->only(['stop_name', 'address', 'pickup_time', 'dropoff_time', 'sequence', 'is_active']);
        $transportStop->update($validated);
        ActivityLogService::log('transport', 'stop_updated', 'A transport route stop was updated.', $transportStop, ['before' => $before, 'after' => $transportStop->fresh()->only(array_keys($before))], $schoolId);

        return response()->json(['message' => 'Transport stop updated successfully.', 'data' => $transportStop->fresh()]);
    }

    public function destroy(Request $request, TransportStop $transportStop)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $transportStop->school_id === $schoolId, 404, 'Transport stop not found.');
        $before = $transportStop->only(['transport_route_id', 'stop_name', 'sequence']);
        $transportStop->delete();
        ActivityLogService::log('transport', 'stop_deleted', 'A transport route stop was removed.', null, ['before' => $before], $schoolId);

        return response()->json(['message' => 'Transport stop deleted successfully.']);
    }
}

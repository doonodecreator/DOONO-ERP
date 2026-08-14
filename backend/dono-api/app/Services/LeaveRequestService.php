<?php

namespace App\Services;

use App\Models\LeaveRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeaveRequestService
{
    public function create(array $data): LeaveRequest
    {
        return DB::transaction(function () use ($data) {
            $this->ensureNoOverlap(
                $data['staff_id'],
                $data['start_date'],
                $data['end_date']
            );

            return LeaveRequest::create($data);
        });
    }

    public function ensureNoOverlap(
        int $staffId,
        string $startDate,
        string $endDate,
        ?int $ignoreId = null
    ): void {
        $query = LeaveRequest::where('staff_id', $staffId)
            ->whereIn('status', ['Pending', 'Approved'])
            ->whereDate('start_date', '<=', $endDate)
            ->whereDate('end_date', '>=', $startDate);

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        if ($query->lockForUpdate()->exists()) {
            throw ValidationException::withMessages([
                'start_date' => [
                    'This staff member already has a pending or approved leave request that overlaps those dates.',
                ],
            ]);
        }
    }
}

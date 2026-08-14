<?php

namespace App\Services;

use App\Models\DisciplineCase;
use Illuminate\Support\Facades\DB;

class DisciplineCaseService
{
    public function create(array $data): DisciplineCase
    {
        return DB::transaction(function () use ($data) {
            $schoolId = $data['school_id'];
            $prefix = 'DC-' . now()->format('Y') . '-';

            $lastCase = DisciplineCase::where('school_id', $schoolId)
                ->where('case_number', 'like', $prefix . '%')
                ->lockForUpdate()
                ->latest('id')
                ->first();

            $sequence = $lastCase
                ? ((int) substr($lastCase->case_number, strlen($prefix))) + 1
                : 1;

            return DisciplineCase::create([
                ...$data,
                'case_number' => $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT),
                'status' => 'Reported',
            ]);
        });
    }
}

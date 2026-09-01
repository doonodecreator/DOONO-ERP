<?php

namespace App\Services;

use App\Models\School;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class StudentAdmissionNumberService
{
    public function allocate(int $schoolId): string
    {
        return DB::transaction(function () use ($schoolId): string {
            $school = School::query()->find($schoolId);

            if (! $school) {
                throw new RuntimeException('The selected school could not be found.');
            }

            $sequence = DB::table('school_admission_sequences')
                ->where('school_id', $schoolId)
                ->lockForUpdate()
                ->first();

            if (! $sequence) {
                DB::table('school_admission_sequences')->insertOrIgnore([
                    'school_id' => $schoolId,
                    'prefix' => $this->prefixFor($school),
                    'next_number' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $sequence = DB::table('school_admission_sequences')
                    ->where('school_id', $schoolId)
                    ->lockForUpdate()
                    ->first();
            }

            if (! $sequence) {
                throw new RuntimeException('The school admission sequence could not be initialized.');
            }

            $prefix = $this->prefixForValue((string) $sequence->prefix, $schoolId);
            $number = max(1, (int) $sequence->next_number);

            do {
                $candidate = sprintf('%s-%06d', $prefix, $number++);
            } while (DB::table('students')->where('admission_number', $candidate)->exists());

            DB::table('school_admission_sequences')
                ->where('school_id', $schoolId)
                ->update([
                    'next_number' => $number,
                    'updated_at' => now(),
                ]);

            return $candidate;
        });
    }

    private function prefixFor(School $school): string
    {
        return $this->prefixForValue((string) $school->school_code, (int) $school->id);
    }

    private function prefixForValue(string $value, int $schoolId): string
    {
        $prefix = strtoupper(trim($value));
        $prefix = preg_replace('/\s+/', '-', $prefix) ?? '';
        $prefix = preg_replace('/[^A-Z0-9-]/', '', $prefix) ?? '';
        $prefix = trim($prefix, '-');

        $prefix = trim(substr($prefix, 0, 45), '-');

        return $prefix !== '' ? $prefix : 'SCH-' . $schoolId;
    }
}

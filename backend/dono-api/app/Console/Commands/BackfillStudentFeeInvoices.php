<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillStudentFeeInvoices extends Command
{
    protected $signature = 'dono:backfill-student-fee-invoices {--dry-run : Report repairs without changing data}';

    protected $description = 'Backfill legacy StudentFee school IDs and immutable invoice numbers safely';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $repaired = 0;
        $skipped = 0;

        $legacyFees = DB::table('student_fees as sf')
            ->join('student_enrollments as se', 'se.id', '=', 'sf.student_enrollment_id')
            ->join('students as st', 'st.id', '=', 'se.student_id')
            ->where(function ($query): void {
                $query->whereNull('sf.school_id')->orWhereNull('sf.invoice_number');
            })
            ->select([
                'sf.id',
                'sf.school_id',
                'sf.invoice_number',
                'se.school_id as enrollment_school_id',
                'st.school_id as student_school_id',
            ])
            ->orderBy('sf.id')
            ->cursor();

        foreach ($legacyFees as $fee) {
            $schoolId = (int) $fee->enrollment_school_id;
            if ($schoolId < 1 || $schoolId !== (int) $fee->student_school_id || ($fee->school_id !== null && (int) $fee->school_id !== $schoolId)) {
                $skipped++;
                $this->warn("Skipped StudentFee {$fee->id}: school evidence is missing or inconsistent.");
                continue;
            }

            if ($dryRun) {
                $repaired++;
                continue;
            }

            try {
                DB::transaction(function () use ($fee, $schoolId): void {
                    $settings = DB::table('school_settings')->where('school_id', $schoolId)->lockForUpdate()->first();
                    if (! $settings) {
                        DB::table('school_settings')->insert([
                            'school_id' => $schoolId,
                            'invoice_prefix' => 'INV',
                            'next_invoice_number' => 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $settings = DB::table('school_settings')->where('school_id', $schoolId)->lockForUpdate()->first();
                    }

                    $update = ['school_id' => $schoolId, 'updated_at' => now()];
                    if ($fee->invoice_number === null) {
                        $prefix = strtoupper(trim((string) ($settings->invoice_prefix ?: 'INV')));
                        $sequence = max(1, (int) ($settings->next_invoice_number ?: 1));
                        do {
                            $invoice = sprintf('%s-%06d', $prefix, $sequence++);
                        } while (DB::table('student_fees')->where('school_id', $schoolId)->where('invoice_number', $invoice)->exists());

                        $update['invoice_number'] = $invoice;
                        DB::table('school_settings')->where('school_id', $schoolId)->update([
                            'next_invoice_number' => $sequence,
                            'updated_at' => now(),
                        ]);
                    } else {
                        $collision = DB::table('student_fees')
                            ->where('school_id', $schoolId)
                            ->where('invoice_number', $fee->invoice_number)
                            ->where('id', '!=', $fee->id)
                            ->exists();
                        if ($collision) {
                            throw new \RuntimeException("Invoice {$fee->invoice_number} already exists in school {$schoolId}.");
                        }
                    }

                    DB::table('student_fees')->where('id', $fee->id)->whereNull('school_id')->orWhere(function ($query) use ($fee): void {
                        $query->where('id', $fee->id)->whereNull('invoice_number');
                    })->update($update);
                });
                $repaired++;
            } catch (\Throwable $exception) {
                $skipped++;
                $this->warn("Skipped StudentFee {$fee->id}: {$exception->getMessage()}");
            }
        }

        $this->info(($dryRun ? 'Would repair' : 'Repaired') . " {$repaired} StudentFee record(s); skipped {$skipped}.");
        return $skipped > 0 ? self::FAILURE : self::SUCCESS;
    }
}

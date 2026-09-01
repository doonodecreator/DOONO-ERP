<?php

namespace App\Console\Commands;

use App\Models\School;
use App\Services\SchoolInsightSnapshotService;
use Illuminate\Console\Command;

class CaptureSchoolInsightSnapshots extends Command
{
    protected $signature = 'insights:snapshot {--days=30 : Number of days included in each snapshot}';

    protected $description = 'Capture explainable, school-scoped School Insights history from stored records';

    public function handle(SchoolInsightSnapshotService $snapshots): int
    {
        $days = (int) $this->option('days');
        $captured = 0;

        School::query()->select(['id', 'name'])->cursor()->each(function (School $school) use ($snapshots, $days, &$captured): void {
            $snapshots->capture($school, $days);
            $captured++;
        });

        $this->info("Captured {$captured} School Insights snapshot(s).");

        return self::SUCCESS;
    }
}


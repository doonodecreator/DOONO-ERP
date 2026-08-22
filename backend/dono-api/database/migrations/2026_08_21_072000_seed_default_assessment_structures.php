<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('schools')->select('id')->orderBy('id')->each(function ($school): void {
            $hasStructures = DB::table('assessment_structures')
                ->where('school_id', $school->id)
                ->exists();

            if ($hasStructures) {
                return;
            }

            $now = now();
            DB::table('assessment_structures')->insert([
                [
                    'school_id' => $school->id,
                    'name' => 'CA',
                    'maximum_marks' => 40,
                    'percentage' => 40,
                    'display_order' => 1,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'school_id' => $school->id,
                    'name' => 'Examination',
                    'maximum_marks' => 60,
                    'percentage' => 60,
                    'display_order' => 2,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        });
    }

    public function down(): void
    {
        // Defaults are retained on rollback to avoid deleting school result data.
    }
};

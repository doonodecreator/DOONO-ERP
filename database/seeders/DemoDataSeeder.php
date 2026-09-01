<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AcademicSession;
use App\Models\Division;
use App\Models\School;
use App\Models\Term;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();

        if (!$school) {
            $this->command->error('No school found.');
            return;
        }

        $session = AcademicSession::firstOrCreate(
            [
                'school_id' => $school->id,
                'name' => '2026/2027',
            ],
            [
                'start_date' => '2026-09-01',
                'end_date' => '2027-07-31',
                'is_current' => true,
                'status' => 'active',
            ]
        );

        Term::firstOrCreate(
            [
                'academic_session_id' => $session->id,
                'name' => 'First Term',
            ],
            [
                'start_date' => '2026-09-01',
                'end_date' => '2026-12-20',
                'is_current' => true,
                'status' => 'active',
            ]
        );

        Term::firstOrCreate(
            [
                'academic_session_id' => $session->id,
                'name' => 'Second Term',
            ],
            [
                'start_date' => '2027-01-10',
                'end_date' => '2027-04-10',
                'is_current' => false,
                'status' => 'active',
            ]
        );

        Term::firstOrCreate(
            [
                'academic_session_id' => $session->id,
                'name' => 'Third Term',
            ],
            [
                'start_date' => '2027-04-25',
                'end_date' => '2027-07-31',
                'is_current' => false,
                'status' => 'active',
            ]
        );

        Division::firstOrCreate(
            [
                'school_id' => $school->id,
                'name' => 'Primary School',
            ],
            [
                'code' => 'PRI',
                'display_order' => 1,
                'is_active' => true,
            ]
        );

        Division::firstOrCreate(
            [
                'school_id' => $school->id,
                'name' => 'Secondary School',
            ],
            [
                'code' => 'SEC',
                'display_order' => 2,
                'is_active' => true,
            ]
        );

        $this->command->info('Demo data seeded successfully.');
    }
}

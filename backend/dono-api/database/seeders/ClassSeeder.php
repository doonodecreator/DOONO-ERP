<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Division;
use App\Models\ClassModel;

class ClassSeeder extends Seeder
{
    public function run(): void
    {
        $primary = Division::where('name', 'Primary School')->first();
        $secondary = Division::where('name', 'Secondary School')->first();

        if ($primary) {
            foreach ([
    'Nursery 0',
    'Nursery 1',
    'Nursery 2',
    'Nursery 3',
    'Primary 1',
    'Primary 2',
    'Primary 3',
    'Primary 4',
    'Primary 5',
    'Primary 6',
] as $index => $name) {
                ClassModel::firstOrCreate(
                    [
                        'division_id' => $primary->id,
                        'name' => $name,
                    ],
                    [
                        'code' => 'P'.($index + 1),
                        'display_order' => $index + 1,
                        'is_active' => true,
                    ]
                );
            }
        }

        if ($secondary) {

            $classes = [
                'JSS 1',
                'JSS 2',
                'JSS 3',
                'SS 1',
                'SS 2',
                'SS 3',
            ];

            foreach ($classes as $index => $name) {

                ClassModel::firstOrCreate(
                    [
                        'division_id' => $secondary->id,
                        'name' => $name,
                    ],
                    [
                        'code' => str_replace(' ', '', $name),
                        'display_order' => $index + 1,
                        'is_active' => true,
                    ]
                );
            }
        }

        $this->command->info('Classes seeded successfully.');
    }
}

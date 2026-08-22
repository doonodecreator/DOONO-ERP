<?php

namespace Tests\Unit;

use App\Services\Academic\AssessmentComputationService;
use App\Services\Academic\RankingService;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AcademicComputationTest extends TestCase
{
    public function test_weighted_component_is_normalized_to_configured_percentage(): void
    {
        $service = new AssessmentComputationService();

        $this->assertSame(25.0, $service->calculateWeightedScore(20, 40, 50));
    }

    public function test_component_above_maximum_marks_is_rejected(): void
    {
        $this->expectException(ValidationException::class);

        (new AssessmentComputationService())->calculateWeightedScore(41, 40, 50);
    }

    public function test_ranking_uses_standard_competition_ties(): void
    {
        $ranked = (new RankingService())->rankStudents([
            ['id' => 1, 'average' => 95],
            ['id' => 2, 'average' => 90],
            ['id' => 3, 'average' => 90],
            ['id' => 4, 'average' => 85],
        ]);

        $positions = collect($ranked)->pluck('position', 'id')->all();

        $this->assertSame([1 => 1, 2 => 2, 3 => 2, 4 => 4], $positions);
    }
}

<?php

namespace Tests\Unit;

use App\Services\StudentAdmissionNumberService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class StudentAdmissionNumberServiceTest extends TestCase
{
    public function test_prefixes_are_normalized_for_human_readable_numbers(): void
    {
        $service = new StudentAdmissionNumberService();
        $method = new ReflectionMethod($service, 'prefixForValue');
        $method->setAccessible(true);

        $this->assertSame('DOONO-CAMPUS-1', $method->invoke($service, ' Doono Campus 1 ', 9));
        $this->assertSame('ABCSCHOOL', $method->invoke($service, 'abc_school', 9));
    }

    public function test_empty_prefixes_use_the_school_id_fallback(): void
    {
        $service = new StudentAdmissionNumberService();
        $method = new ReflectionMethod($service, 'prefixForValue');
        $method->setAccessible(true);

        $this->assertSame('SCH-42', $method->invoke($service, '---', 42));
    }
}

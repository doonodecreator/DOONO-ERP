<?php

namespace Tests\Unit;

use App\Services\StudentAdmissionNumberService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use ReflectionMethod;
use RuntimeException;
use Tests\TestCase;

class StudentAdmissionNumberServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('school_admission_sequences');
        Schema::dropIfExists('students');
        Schema::dropIfExists('schools');

        Schema::create('schools', function (Blueprint $table): void {
            $table->id();
            $table->string('school_code')->unique();
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table): void {
            $table->id();
            $table->string('admission_number')->unique();
        });

        Schema::create('school_admission_sequences', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->unique()
                ->constrained('schools')->cascadeOnDelete();
            $table->string('prefix', 50);
            $table->unsignedBigInteger('next_number')->default(1);
            $table->timestamps();
        });
    }

    private function createSchool(string $schoolCode): int
    {
        return DB::table('schools')->insertGetId([
            'school_code' => $schoolCode,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_prefixes_are_normalized_for_human_readable_numbers(): void
    {
        $service = new StudentAdmissionNumberService();
        $method = new ReflectionMethod($service, 'prefixForValue');

        $this->assertSame('DOONO-CAMPUS-1', $method->invoke($service, ' Doono Campus 1 ', 9));
        $this->assertSame('ABCSCHOOL', $method->invoke($service, 'abc_school', 9));
    }

    public function test_empty_prefixes_use_the_school_id_fallback(): void
    {
        $service = new StudentAdmissionNumberService();
        $method = new ReflectionMethod($service, 'prefixForValue');

        $this->assertSame('SCH-42', $method->invoke($service, '---', 42));
    }

    public function test_allocation_generates_sequential_numbers_for_a_school(): void
    {
        $schoolId = $this->createSchool('DOONO');
        $service = new StudentAdmissionNumberService();

        $this->assertSame('DOONO-000001', $service->allocate($schoolId));
        $this->assertSame('DOONO-000002', $service->allocate($schoolId));

        $this->assertSame(3, (int) DB::table('school_admission_sequences')
            ->where('school_id', $schoolId)->value('next_number'));
    }

    public function test_each_school_has_an_independent_admission_sequence(): void
    {
        $firstSchool = $this->createSchool('SCHOOL-A');
        $secondSchool = $this->createSchool('SCHOOL-B');
        $service = new StudentAdmissionNumberService();

        $this->assertSame('SCHOOL-A-000001', $service->allocate($firstSchool));
        $this->assertSame('SCHOOL-A-000002', $service->allocate($firstSchool));
        $this->assertSame('SCHOOL-B-000001', $service->allocate($secondSchool));
    }

    public function test_existing_admission_numbers_are_skipped(): void
    {
        $schoolId = $this->createSchool('DOONO');

        DB::table('students')->insert([
            'admission_number' => 'DOONO-000001',
        ]);

        $service = new StudentAdmissionNumberService();

        $this->assertSame('DOONO-000002', $service->allocate($schoolId));

        $this->assertSame(3, (int) DB::table('school_admission_sequences')
            ->where('school_id', $schoolId)->value('next_number'));
    }

    public function test_allocation_rejects_a_school_that_does_not_exist(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('The selected school could not be found.');

        (new StudentAdmissionNumberService())->allocate(999999);
    }
}

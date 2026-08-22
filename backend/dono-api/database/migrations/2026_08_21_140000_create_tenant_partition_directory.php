<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tenant_partitions')) {
            Schema::create('tenant_partitions', function (Blueprint $table) {
                $table->id();
                $table->string('partition_key', 80)->unique();
                $table->string('region', 80)->default('default')->index();
                $table->string('connection_name', 100)->nullable();
                $table->string('database_name', 150)->nullable();
                $table->enum('status', ['active', 'draining', 'disabled'])->default('active')->index();
                $table->unsignedBigInteger('capacity_limit')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        DB::table('tenant_partitions')->updateOrInsert(
            ['partition_key' => 'primary'],
            [
                'region' => 'default',
                'status' => 'active',
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );

        if (! Schema::hasColumn('schools', 'tenant_partition_id')) {
            Schema::table('schools', function (Blueprint $table) {
                $table->unsignedBigInteger('tenant_partition_id')->nullable()->after('organization_id');
                $table->string('partition_key', 80)->default('primary')->after('tenant_partition_id');
                $table->string('data_region', 80)->default('default')->after('partition_key');
                $table->index(['tenant_partition_id', 'partition_key']);
                $table->index(['data_region', 'status']);
            });
        }

        $primaryId = DB::table('tenant_partitions')->where('partition_key', 'primary')->value('id');
        if ($primaryId) {
            DB::table('schools')->whereNull('tenant_partition_id')->update([
                'tenant_partition_id' => $primaryId,
                'partition_key' => 'primary',
                'data_region' => 'default',
            ]);
        }

        $this->addCompositeIndex('students', ['school_id', 'status'], 'students_school_status_idx');
        $this->addCompositeIndex('staff', ['school_id', 'status'], 'staff_school_status_idx');
        $this->addCompositeIndex('student_enrollments', ['school_id', 'status'], 'enrollments_school_status_idx');
        $this->addCompositeIndex('timetables', ['school_id', 'academic_session_id', 'term_id'], 'timetables_school_term_idx');
        $this->addCompositeIndex('attendances', ['school_id', 'attendance_date'], 'attendances_school_date_idx');
        $this->addCompositeIndex('results', ['school_id', 'student_id'], 'results_school_student_idx');
    }

    public function down(): void
    {
        if (Schema::hasColumn('schools', 'tenant_partition_id')) {
            Schema::table('schools', function (Blueprint $table) {
                $table->dropIndex(['tenant_partition_id', 'partition_key']);
                $table->dropIndex(['data_region', 'status']);
                $table->dropColumn(['tenant_partition_id', 'partition_key', 'data_region']);
            });
        }

        Schema::dropIfExists('tenant_partitions');
    }

    private function addCompositeIndex(string $tableName, array $columns, string $indexName): void
    {
        if (! Schema::hasTable($tableName) || collect($columns)->contains(fn ($column) => ! Schema::hasColumn($tableName, $column))) {
            return;
        }

        $existing = collect(Schema::getIndexes($tableName))->pluck('name')->all();
        if (! in_array($indexName, $existing, true)) {
            Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName) {
                $table->index($columns, $indexName);
            });
        }
    }
};

<?php

namespace App\Services;

use App\Models\School;
use App\Models\TenantPartition;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class TenantPartitionService
{
    public function assignDefault(School $school): void
    {
        if (! Schema::hasColumn('schools', 'tenant_partition_id')) {
            return;
        }

        $partition = TenantPartition::query()->firstOrCreate(
            ['partition_key' => 'primary'],
            ['region' => 'default', 'status' => 'active'],
        );

        $school->forceFill([
            'tenant_partition_id' => $partition->id,
            'partition_key' => $partition->partition_key,
            'data_region' => $partition->region,
        ])->saveQuietly();
    }

    public function forSchool(?School $school): array
    {
        if (! $school || ! Schema::hasColumn('schools', 'partition_key')) {
            return [
                'partition_key' => null,
                'region' => null,
                'connection_name' => null,
                'database_name' => null,
                'status' => null,
            ];
        }

        $key = 'tenant-partition:school:'.$school->id;
        $partitionData = Cache::remember($key, now()->addMinutes(5), function () use ($school) {
            $partition = $school->relationLoaded('tenantPartition')
                ? $school->tenantPartition
                : TenantPartition::query()->find($school->tenant_partition_id);

            return $partition ? $partition->toArray() : null;
        });

        return [
            'partition_key' => $school->partition_key ?: ($partitionData['partition_key'] ?? 'primary'),
            'region' => $school->data_region ?: ($partitionData['region'] ?? 'default'),
            'connection_name' => $partitionData['connection_name'] ?? null,
            'database_name' => $partitionData['database_name'] ?? null,
            'status' => $partitionData['status'] ?? 'active',
        ];
    }
}

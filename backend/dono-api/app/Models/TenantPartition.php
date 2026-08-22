<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TenantPartition extends Model
{
    protected $fillable = [
        'partition_key',
        'region',
        'connection_name',
        'database_name',
        'status',
        'capacity_limit',
        'metadata',
    ];

    protected $casts = [
        'capacity_limit' => 'integer',
        'metadata' => 'array',
    ];

    public function schools(): HasMany
    {
        return $this->hasMany(School::class, 'tenant_partition_id');
    }
}

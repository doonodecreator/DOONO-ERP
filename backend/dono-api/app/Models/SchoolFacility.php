<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolFacility extends Model
{
    protected $fillable = [
        'school_id',
        'name',
        'category',
        'location',
        'condition',
        'status',
        'description',
        'last_inspected_at',
        'next_inspection_at',
        'responsible_staff_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'last_inspected_at' => 'date',
        'next_inspection_at' => 'date',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function responsibleStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'responsible_staff_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

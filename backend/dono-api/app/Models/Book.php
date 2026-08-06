<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    protected $fillable = [
        'school_id',
        'title',
        'author',
        'isbn',
        'category',
        'total_copies',
        'available_copies',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function loans()
    {
        return $this->hasMany(BookLoan::class);
    }
}

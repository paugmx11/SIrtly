<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = [
        'name',
        'email',
        'company',
        'phone',
        'message',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $table = 'companies';

    protected $fillable = [
        'name',
        'cif',
        'email',
        'phone',
        'address',
        'status',
    ];

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }
}

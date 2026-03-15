<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanySetting extends Model
{
    protected $table = 'company_settings';

    protected $fillable = [
        'company_id',
        'primary_color',
        'secondary_color',
        'logo',
        'system_name',
        'favicon',
        'assignment_mode',
        'categories',
        'priorities',
        'departments',
        'specialties',
    ];

    protected $casts = [
        'categories' => 'array',
        'priorities' => 'array',
        'departments' => 'array',
        'specialties' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}

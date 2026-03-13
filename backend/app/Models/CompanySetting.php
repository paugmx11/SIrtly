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
    ];

    public $timestamps = false;

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}

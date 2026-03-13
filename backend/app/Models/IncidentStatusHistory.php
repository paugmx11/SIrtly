<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentStatusHistory extends Model
{
    protected $table = 'incident_status_history';

    protected $fillable = [
        'incident_id',
        'status_id',
        'changed_by',
    ];

    const CREATED_AT = 'changed_at';
    const UPDATED_AT = null;

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(IncidentStatus::class, 'status_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}

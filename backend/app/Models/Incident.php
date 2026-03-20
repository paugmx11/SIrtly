<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Incident extends Model
{
    protected $table = 'incidents';

    protected $fillable = [
        'company_id',
        'created_by',
        'assigned_to',
        'status_id',
        'title',
        'description',
        'category',
        'priority',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(IncidentStatus::class, 'status_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(IncidentAttachment::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(IncidentStatusHistory::class);
    }
}

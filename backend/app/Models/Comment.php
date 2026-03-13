<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    protected $table = 'incident_comments';

    protected $fillable = [
        'incident_id',
        'user_id',
        'comment',
    ];

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

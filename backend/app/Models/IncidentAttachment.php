<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentAttachment extends Model
{
    protected $table = 'incident_attachments';

    protected static function booted(): void
    {
        static::deleting(function (IncidentAttachment $attachment) {
            // Limpieza física: si se elimina el registro, borrar el archivo del storage.
            // (El controller ya borra, pero esto protege contra eliminaciones directas.)
            if ($attachment->file_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($attachment->file_path);
            }
        });
    }

    protected $fillable = [
        'incident_id',
        'file_path',
        'uploaded_by',
    ];

    const CREATED_AT = 'uploaded_at';
    const UPDATED_AT = null;

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}

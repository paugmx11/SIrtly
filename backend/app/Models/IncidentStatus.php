<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncidentStatus extends Model
{
    protected $table = 'incident_status';

    public $timestamps = false;

    protected $fillable = [
        'name',
    ];
}

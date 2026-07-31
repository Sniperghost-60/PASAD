<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DataExport extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'scope', 'selection', 'format', 'date_from', 'date_to',
        'status', 'disk', 'path', 'filename', 'error', 'completed_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'date_from' => 'date',
            'date_to' => 'date',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}

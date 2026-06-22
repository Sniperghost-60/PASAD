<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Arrondissement extends Model
{
    protected $fillable = ['commune_id', 'nom'];

    /**
     * Obtenir la commune de cet arrondissement
     */
    public function commune(): BelongsTo
    {
        return $this->belongsTo(Commune::class);
    }
}

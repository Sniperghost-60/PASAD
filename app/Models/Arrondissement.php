<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Arrondissement extends Model
{
    protected $fillable = ['commune_id', 'nom'];

    public function commune(): BelongsTo
    {
        return $this->belongsTo(Commune::class);
    }

    public function conseillers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conseiller_arrondissement');
    }
}

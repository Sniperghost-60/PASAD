<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Commune extends Model
{
    protected $fillable = ['departement_id', 'nom'];

    /**
     * Obtenir le département de cette commune
     */
    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    /**
     * Obtenir tous les arrondissements de cette commune
     */
    public function arrondissements(): HasMany
    {
        return $this->hasMany(Arrondissement::class);
    }

    /**
     * Obtenir tous les conseillers affectés à cette commune
     */
    public function conseillers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conseiller_commune');
    }
}

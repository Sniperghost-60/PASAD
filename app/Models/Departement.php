<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departement extends Model
{
    protected $fillable = ['code', 'nom'];

    /**
     * Obtenir toutes les communes de ce département
     */
    public function communes(): HasMany
    {
        return $this->hasMany(Commune::class);
    }
}

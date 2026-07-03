<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiEvolutionProduitsOrganiques extends Model
{
    protected $table    = 'cai_evolution_produits_organiques';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = ['donnees' => 'array'];
}

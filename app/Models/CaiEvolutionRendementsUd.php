<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiEvolutionRendementsUd extends Model
{
    protected $table    = 'cai_evolution_rendements_ud';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = ['donnees' => 'array'];
}

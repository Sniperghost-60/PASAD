<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiEvolutionEspeces extends Model
{
    protected $table    = 'cai_evolution_especes';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = ['donnees' => 'array'];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiEtudeMarche extends Model
{
    protected $table = 'cai_etude_marche';

    protected $fillable = [
        'user_id',
        'commune_id',
        'categorie',
        'parametre',
        'tendances_marches',
        'situation_exploitation',
        'ecarts_combler',
    ];

    protected $casts = [
        'tendances_marches'      => 'array',
        'situation_exploitation' => 'array',
        'ecarts_combler'         => 'array',
    ];
}

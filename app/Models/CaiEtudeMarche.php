<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiEtudeMarche extends Model
{
    protected $table = 'cai_etude_marche';

    protected $fillable = [
        'user_id',
        'commune_id',
        'date_session',
        'categorie',
        'parametre',
        'tendances_marches',
        'situation_exploitation',
        'ecarts_combler',
    ];

    protected $casts = [
        'date_session' => 'date:Y-m-d',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiMarcheCaracterisation extends Model
{
    protected $table = 'cai_marches_caracterisation';

    protected $fillable = [
        'user_id', 'commune_id', 'date_session', 'nom_marche',
        'distance', 'type_marche', 'localisation', 'frequence_animation',
        'etat_route', 'facilite_transport', 'cout_transport', 'securite',
        'produits',
    ];

    protected $casts = [
        'date_session' => 'date:Y-m-d',
        'produits'     => 'array',
    ];
}

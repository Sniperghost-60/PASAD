<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiAgroecologieProducteur extends Model
{
    protected $table = 'cai_agroecologie_producteurs';

    protected $fillable = [
        'user_id', 'commune_id',
        'departement', 'commune_nom', 'arrondissement', 'village',
        'nom_producteur', 'prenoms_producteur', 'contact1', 'contact2', 'sexe',
        'pratiques',
    ];

    protected $casts = [
        'pratiques' => 'array',
    ];
}

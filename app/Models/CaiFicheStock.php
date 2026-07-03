<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiFicheStock extends Model
{
    protected $table    = 'cai_fiche_stock';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = [
        'donnees' => 'array',
    ];
}

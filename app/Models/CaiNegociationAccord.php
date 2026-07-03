<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiNegociationAccord extends Model
{
    protected $fillable = [
        'user_id', 'commune_id', 'numero',
        'contraintes_a_lever', 'activites', 'responsables',
        'periode_debut', 'periode_fin', 'moyens_conseiller', 'moyens_op_exploitation',
    ];

    protected $casts = [
        'responsables'  => 'array',
        'periode_debut' => 'date:Y-m-d',
        'periode_fin'   => 'date:Y-m-d',
    ];
}

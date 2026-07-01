<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiNegociationAccord extends Model
{
    protected $fillable = [
        'user_id', 'commune_id', 'date_session', 'numero',
        'contraintes_a_lever', 'activites', 'responsables',
        'periode_execution', 'moyens_conseiller', 'moyens_op_exploitation',
    ];

    protected $casts = [
        'date_session' => 'date:Y-m-d',
    ];
}

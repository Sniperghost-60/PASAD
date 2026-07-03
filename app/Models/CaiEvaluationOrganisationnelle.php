<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiEvaluationOrganisationnelle extends Model
{
    protected $table    = 'cai_evaluation_organisationnelle';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = ['donnees' => 'array'];
}

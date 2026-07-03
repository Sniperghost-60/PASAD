<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiEvaluationInstitutionnelle extends Model
{
    protected $table    = 'cai_evaluation_institutionnelle';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = ['donnees' => 'array'];
}

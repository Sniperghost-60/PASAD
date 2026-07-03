<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiEvaluationSociale extends Model
{
    protected $table    = 'cai_evaluation_sociale';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = ['donnees' => 'array'];
}

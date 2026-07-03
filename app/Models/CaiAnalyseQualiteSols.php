<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiAnalyseQualiteSols extends Model
{
    protected $table    = 'cai_analyse_qualite_sols';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = ['donnees' => 'array'];
}

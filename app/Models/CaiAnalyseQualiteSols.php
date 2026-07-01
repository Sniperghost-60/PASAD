<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiAnalyseQualiteSols extends Model
{
    protected $table    = 'cai_analyse_qualite_sols';
    protected $fillable = ['user_id', 'commune_id', 'date_session', 'donnees'];
    protected $casts    = ['date_session' => 'date:Y-m-d', 'donnees' => 'array'];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiProgrammeQuinzaine extends Model
{
    protected $table    = 'cai_programme_quinzaine';
    protected $fillable = ['user_id', 'commune_id', 'date_session', 'donnees'];
    protected $casts    = [
        'date_session' => 'date:Y-m-d',
        'donnees'      => 'array',
    ];
}

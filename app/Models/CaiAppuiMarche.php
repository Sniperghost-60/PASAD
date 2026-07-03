<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiAppuiMarche extends Model
{
    protected $table    = 'cai_appui_marche';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = [
        'donnees' => 'array',
    ];
}

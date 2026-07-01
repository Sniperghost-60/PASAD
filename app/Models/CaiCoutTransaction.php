<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaiCoutTransaction extends Model
{
    use HasFactory;

    protected $table    = 'cai_cout_transaction';
    protected $fillable = ['user_id', 'commune_id', 'date_session', 'donnees'];
    protected $casts    = ['date_session' => 'date:Y-m-d', 'donnees' => 'array'];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaiCoutTransaction extends Model
{
    use HasFactory;

    protected $table    = 'cai_cout_transaction';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = ['donnees' => 'array'];
}

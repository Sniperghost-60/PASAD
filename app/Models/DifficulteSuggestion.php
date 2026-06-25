<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DifficulteSuggestion extends Model
{
    protected $table = 'difficultes_suggestions';

    protected $fillable = [
        'user_id', 'cep_id',
        'difficulte',
        'solution_utilisee',
        'suggestion',
    ];

    protected $casts = [
        'difficulte'        => 'array',
        'solution_utilisee' => 'array',
        'suggestion'        => 'array',
    ];

    public function user() { return $this->belongsTo(User::class); }
}

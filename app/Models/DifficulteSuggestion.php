<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DifficulteSuggestion extends Model
{
    protected $table = 'difficultes_suggestions';

    protected $fillable = [
        'user_id',
        'difficulte',
        'solution_utilisee',
        'suggestion',
    ];

    public function user() { return $this->belongsTo(User::class); }
}

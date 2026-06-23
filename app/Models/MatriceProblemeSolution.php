<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatriceProblemeSolution extends Model
{
    use HasFactory;

    protected $table = 'matrice_probleme_solutions';

    protected $fillable = [
        'matrice_probleme_id',
        'type',
        'solution',
        'statut',
    ];

    public function probleme()
    {
        return $this->belongsTo(MatriceProbleme::class, 'matrice_probleme_id');
    }
}

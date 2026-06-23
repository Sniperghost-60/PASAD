<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CurriculumApprentissageCep extends Model
{
    use HasFactory;

    protected $table = 'curriculum_apprentissage_cep';

    protected $fillable = [
        'profil_historique_id',
        'matrice_probleme_id',
        'user_id',
        'option_solution_tester',
        'quoi_faire_activite',
        'moyens',
        'periode_debut',
        'periode_fin',
        'responsable',
    ];

    public function profilHistorique()
    {
        return $this->belongsTo(ProfilHistorique::class);
    }

    public function probleme()
    {
        return $this->belongsTo(MatriceProbleme::class, 'matrice_probleme_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResumeProtocoleExperimentation extends Model
{
    use HasFactory;

    protected $table = 'resume_protocoles_experimentations';

    protected $fillable = [
        'profil_historique_id',
        'matrice_probleme_id',
        'user_id',
        'titre_experimentation',
        'dispositif_experimental',
        'sujet_special',
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

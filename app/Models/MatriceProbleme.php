<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatriceProbleme extends Model
{
    use HasFactory;

    protected $table = 'matrice_problemes';

    protected $fillable = [
        'profil_historique_id',
        'user_id',
        'probleme',
        'causes',
        'est_pertinent',
    ];

    public function profilHistorique()
    {
        return $this->belongsTo(ProfilHistorique::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function solutions()
    {
        return $this->hasMany(MatriceProblemeSolution::class);
    }

    public function curriculumApprentissageCep()
    {
        return $this->hasMany(CurriculumApprentissageCep::class);
    }
}

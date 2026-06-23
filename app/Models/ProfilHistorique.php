<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProfilHistorique extends Model
{
    use HasFactory;

    protected $table = 'profil_historique';

    protected $fillable = [
        'user_id',
        'departement_id',
        'commune_id',
        'arrondissement_id',
        'village',
        'annee',
        'evenements',
        'impact',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }

    public function commune()
    {
        return $this->belongsTo(Commune::class);
    }

    public function arrondissement()
    {
        return $this->belongsTo(Arrondissement::class);
    }

    public function hierarchisationDomainesActivites()
    {
        return $this->hasMany(HierarchisationDomaineActivite::class);
    }

    public function hierarchisationSpeculationsAgricoles()
    {
        return $this->hasMany(HierarchisationSpeculationAgricole::class);
    }

    public function matriceProblemes()
    {
        return $this->hasMany(MatriceProbleme::class);
    }

    public function curriculumApprentissageCep()
    {
        return $this->hasMany(CurriculumApprentissageCep::class);
    }
}

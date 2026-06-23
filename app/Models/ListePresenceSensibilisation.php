<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ListePresenceSensibilisation extends Model
{
    use HasFactory;

    protected $table = 'liste_presence_sensibilisation';

    protected $fillable = [
        'user_id',
        'date_session',
        'departement_id',
        'commune_id',
        'arrondissement_id',
        'village',
        'nom_producteur',
        'prenoms_producteur',
        'contact1_producteur',
        'contact2_producteur',
        'sexe',
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
}

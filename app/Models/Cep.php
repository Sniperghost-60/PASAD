<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cep extends Model
{
    protected $table = 'cep';

    protected $fillable = [
        'user_id', 'nom_cep', 'adresse',
        'departement_id', 'commune_id', 'arrondissement_id', 'village',
        'latitude', 'longitude',
    ];

    public function user()          { return $this->belongsTo(User::class); }
    public function departement()   { return $this->belongsTo(Departement::class); }
    public function commune()       { return $this->belongsTo(Commune::class); }
    public function arrondissement(){ return $this->belongsTo(Arrondissement::class); }

    public function membres()
    {
        return $this->hasMany(CepMembre::class);
    }
}

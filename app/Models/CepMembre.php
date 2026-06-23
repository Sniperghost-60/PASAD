<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CepMembre extends Model
{
    protected $table = 'cep_membres';

    protected $fillable = [
        'cep_id',
        'identification_participant_cep_id',
        'responsabilite',
    ];

    public function cep()
    {
        return $this->belongsTo(Cep::class);
    }

    public function participant()
    {
        return $this->belongsTo(IdentificationParticipantCep::class, 'identification_participant_cep_id');
    }
}

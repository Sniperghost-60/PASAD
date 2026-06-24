<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnimationSessionCep extends Model
{
    protected $table = 'animation_sessions_cep';

    protected $fillable = [
        'user_id', 'cep_id',
        'profil_historique_id',
        'date_session',
        'resume_protocole_experimentation_id',
        'periode_duree',
        'superficie_couverte',
        'innovations',
        'appreciation_generale',
    ];

    protected $casts = [
        'innovations' => 'array',
    ];

    public function user()              { return $this->belongsTo(User::class); }
    public function profilHistorique()  { return $this->belongsTo(ProfilHistorique::class); }
    public function protocole()
    {
        return $this->belongsTo(ResumeProtocoleExperimentation::class, 'resume_protocole_experimentation_id');
    }
}

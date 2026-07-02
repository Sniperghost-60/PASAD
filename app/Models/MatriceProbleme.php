<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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

    protected function causes(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (blank($value)) return [];
                $decoded = json_decode($value, true);
                return is_array($decoded) ? array_values($decoded) : [$value];
            },
            set: function ($value) {
                $list = is_array($value) ? $value : [$value];
                $filtered = array_values(array_filter(array_map('trim', $list), fn ($c) => $c !== ''));
                return $filtered ? json_encode($filtered, JSON_UNESCAPED_UNICODE) : null;
            },
        );
    }

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

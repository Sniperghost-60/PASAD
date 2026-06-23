<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'telephone', 'password', 'is_blocked', 'is_suspended', 'is_frozen', 'blocked_at', 'suspended_at', 'frozen_at', 'blocked_reason', 'suspended_reason', 'frozen_reason'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_blocked' => 'boolean',
            'is_suspended' => 'boolean',
            'is_frozen' => 'boolean',
            'blocked_at' => 'datetime',
            'suspended_at' => 'datetime',
            'frozen_at' => 'datetime',
        ];
    }

    /**
     * Obtenir toutes les communes affectées à ce conseiller
     */
    public function communes(): BelongsToMany
    {
        return $this->belongsToMany(Commune::class, 'conseiller_commune');
    }

    /**
     * Obtenir tous les arrondissements affectés à ce conseiller
     */
    public function arrondissements(): BelongsToMany
    {
        return $this->belongsToMany(Arrondissement::class, 'conseiller_arrondissement');
    }
}

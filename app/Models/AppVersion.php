<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppVersion extends Model
{
    protected $fillable = [
        'min_version',
        'latest_version',
        'force_update',
        'android_url',
        'ios_url',
        'release_notes',
        'published_by',
    ];

    protected $casts = [
        'force_update' => 'boolean',
    ];

    /**
     * Retourne le seul enregistrement de configuration (toujours id=1 ou le dernier).
     */
    public static function current(): self
    {
        return self::latest('id')->firstOrFail();
    }

    /**
     * Compare une version applicative à la version minimale requise.
     * Retourne true si $appVersion est trop ancienne (doit être mise à jour).
     */
    public static function isOutdated(string $appVersion): bool
    {
        $current = self::current();
        return version_compare($appVersion, $current->min_version, '<');
    }
}

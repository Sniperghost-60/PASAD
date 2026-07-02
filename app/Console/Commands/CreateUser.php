<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Commune;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateUser extends Command
{
    protected $signature = 'user:create
        {--name=       : Nom complet de l\'utilisateur}
        {--email=      : Adresse e-mail}
        {--role=       : Rôle (Super-Admin | Administrateur | Superviseur | Conseiller)}
        {--password=   : Mot de passe (généré automatiquement si omis)}
        {--telephone=  : Numéro de téléphone (optionnel)}
        {--communes=   : IDs des communes séparés par virgule (ex: 1,2,3) — pour Conseiller}';

    protected $description = 'Créer un nouveau compte utilisateur PARSAD';

    public function handle(): int
    {
        $this->line('');
        $this->line('  <fg=cyan>╔══════════════════════════════════════╗</>');
        $this->line('  <fg=cyan>║   PARSAD — Création de compte         ║</>');
        $this->line('  <fg=cyan>╚══════════════════════════════════════╝</>');
        $this->line('');

        /* ── Saisie interactive si options manquantes ── */
        $name = $this->option('name')
            ?: $this->ask('Nom complet');

        $email = $this->option('email')
            ?: $this->ask('Adresse e-mail');

        if (User::where('email', $email)->exists()) {
            $this->error("  ✗ Un compte avec l'email «{$email}» existe déjà.");
            return self::FAILURE;
        }

        $roles = ['Super-Admin', 'Administrateur', 'Superviseur', 'Conseiller'];
        $role  = $this->option('role');
        if (! $role || ! in_array($role, $roles)) {
            $role = $this->choice('Rôle', $roles, 3);
        }

        $telephone = $this->option('telephone')
            ?: $this->ask('Téléphone (laisser vide pour ignorer)', null);

        $password = $this->option('password')
            ?: Str::password(12);

        /* ── Création ── */
        $user = User::create([
            'name'      => $name,
            'email'     => $email,
            'telephone' => $telephone ?: null,
            'password'  => Hash::make($password),
        ]);

        $user->assignRole($role);

        /* ── Communes (pour Conseiller) ── */
        if ($role === 'Conseiller') {
            $communeIds = $this->option('communes');
            if (! $communeIds) {
                $communeIds = $this->ask('IDs des communes à affecter (séparés par virgule, ou vide)');
            }
            if ($communeIds) {
                $ids = array_filter(array_map('trim', explode(',', $communeIds)));
                $found = Commune::whereIn('id', $ids)->pluck('nom', 'id');
                if ($found->count()) {
                    $user->communes()->sync($found->keys());
                    $this->line("  <fg=green>✓</> Communes affectées : " . $found->values()->join(', '));
                } else {
                    $this->warn('  Aucune commune trouvée avec ces IDs.');
                }
            }
        }

        /* ── Résumé ── */
        $this->line('');
        $this->line('  <fg=green>✓ Compte créé avec succès !</>');
        $this->line('');
        $this->table(
            ['Champ', 'Valeur'],
            [
                ['Nom',       $name],
                ['E-mail',    $email],
                ['Rôle',      $role],
                ['Téléphone', $telephone ?: '—'],
                ['Mot de passe', $this->option('password') ? '(fourni)' : $password],
            ]
        );

        if (! $this->option('password')) {
            $this->warn('  ⚠  Notez le mot de passe ci-dessus, il ne sera plus affiché.');
        }

        $this->line('');
        return self::SUCCESS;
    }
}

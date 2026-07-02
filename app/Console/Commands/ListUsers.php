<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ListUsers extends Command
{
    protected $signature = 'user:list
        {--role=  : Filtrer par rôle}
        {--email= : Rechercher par e-mail}';

    protected $description = 'Lister les comptes utilisateurs PARSAD';

    public function handle(): int
    {
        $query = User::with('roles');

        if ($role = $this->option('role')) {
            $query->role($role);
        }
        if ($email = $this->option('email')) {
            $query->where('email', 'like', "%{$email}%");
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        if ($users->isEmpty()) {
            $this->warn('Aucun utilisateur trouvé.');
            return self::SUCCESS;
        }

        $this->line('');
        $this->line("  <fg=cyan>PARSAD — {$users->count()} utilisateur(s)</>");
        $this->line('');

        $this->table(
            ['ID', 'Nom', 'E-mail', 'Téléphone', 'Rôle', 'Statut', 'Créé le'],
            $users->map(fn ($u) => [
                $u->id,
                $u->name,
                $u->email,
                $u->telephone ?? '—',
                $u->getRoleNames()->join(', ') ?: '—',
                $u->is_blocked ? '🔴 Bloqué' : ($u->is_suspended ? '🟡 Suspendu' : '🟢 Actif'),
                $u->created_at->format('d/m/Y H:i'),
            ])->toArray()
        );

        $this->line('');
        return self::SUCCESS;
    }
}

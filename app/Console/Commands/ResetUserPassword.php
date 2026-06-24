<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ResetUserPassword extends Command
{
    protected $signature = 'user:reset-password
        {email            : E-mail de l\'utilisateur}
        {--password=      : Nouveau mot de passe (généré si omis)}';

    protected $description = 'Réinitialiser le mot de passe d\'un utilisateur';

    public function handle(): int
    {
        $email = $this->argument('email');
        $user  = User::where('email', $email)->first();

        if (! $user) {
            $this->error("Aucun utilisateur trouvé avec l'email : {$email}");
            return self::FAILURE;
        }

        $password = $this->option('password') ?: Str::password(12);

        $user->update(['password' => Hash::make($password)]);

        $this->line('');
        $this->line("  <fg=green>✓ Mot de passe réinitialisé pour {$user->name}</>");
        $this->line('');
        $this->table(
            ['Champ', 'Valeur'],
            [
                ['Utilisateur', $user->name],
                ['E-mail',      $user->email],
                ['Nouveau mot de passe', $this->option('password') ? '(fourni)' : $password],
            ]
        );

        if (! $this->option('password')) {
            $this->warn('  ⚠  Notez le mot de passe ci-dessus, il ne sera plus affiché.');
        }

        $this->line('');
        return self::SUCCESS;
    }
}

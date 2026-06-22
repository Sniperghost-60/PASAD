<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Vider le cache des permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Permissions ────────────────────────────────────────────────────
        $permissions = [
            // Producteurs
            'producteurs.voir', 'producteurs.créer', 'producteurs.modifier', 'producteurs.supprimer',
            // Parcelles
            'parcelles.voir', 'parcelles.créer', 'parcelles.modifier', 'parcelles.supprimer',
            // Suivis CEP
            'suivis.voir', 'suivis.créer', 'suivis.modifier', 'suivis.supprimer',
            // Rapports
            'rapports.voir', 'rapports.générer', 'rapports.exporter',
            // Caisse & stocks
            'caisse.voir', 'caisse.gérer',
            // Utilisateurs
            'utilisateurs.voir', 'utilisateurs.créer', 'utilisateurs.modifier', 'utilisateurs.supprimer',
            // Rôles
            'roles.gérer',
            // Configuration
            'config.gérer',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ── Rôles & attribution des permissions ────────────────────────────

        // Conseiller — accès de base : lecture + saisie terrain
        $conseiller = Role::firstOrCreate(['name' => 'Conseiller', 'guard_name' => 'web']);
        $conseiller->syncPermissions([
            'producteurs.voir', 'producteurs.créer', 'producteurs.modifier',
            'parcelles.voir', 'parcelles.créer', 'parcelles.modifier',
            'suivis.voir', 'suivis.créer', 'suivis.modifier',
            'rapports.voir',
            'caisse.voir',
        ]);

        // Superviseur — supervision multi-conseillers
        $superviseur = Role::firstOrCreate(['name' => 'Superviseur', 'guard_name' => 'web']);
        $superviseur->syncPermissions([
            'producteurs.voir', 'producteurs.créer', 'producteurs.modifier', 'producteurs.supprimer',
            'parcelles.voir', 'parcelles.créer', 'parcelles.modifier', 'parcelles.supprimer',
            'suivis.voir', 'suivis.créer', 'suivis.modifier', 'suivis.supprimer',
            'rapports.voir', 'rapports.générer', 'rapports.exporter',
            'caisse.voir', 'caisse.gérer',
            'utilisateurs.voir',
        ]);

        // Administrateur — gestion complète sauf rôles & config système
        $admin = Role::firstOrCreate(['name' => 'Administrateur', 'guard_name' => 'web']);
        $admin->syncPermissions([
            'producteurs.voir', 'producteurs.créer', 'producteurs.modifier', 'producteurs.supprimer',
            'parcelles.voir', 'parcelles.créer', 'parcelles.modifier', 'parcelles.supprimer',
            'suivis.voir', 'suivis.créer', 'suivis.modifier', 'suivis.supprimer',
            'rapports.voir', 'rapports.générer', 'rapports.exporter',
            'caisse.voir', 'caisse.gérer',
            'utilisateurs.voir', 'utilisateurs.créer', 'utilisateurs.modifier', 'utilisateurs.supprimer',
        ]);

        // Super-Admin — toutes les permissions
        $superAdmin = Role::firstOrCreate(['name' => 'Super-Admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // ── Utilisateur de test ────────────────────────────────────────────
        $user = User::firstOrCreate(
            ['email' => 'admin@agrisuivi.fr'],
            [
                'name'               => 'Admin CEP',
                'password'           => 'password123',
                'email_verified_at'  => now(),
            ]
        );
        $user->syncRoles(['Super-Admin']);

        // Conseiller de test
        $conseiller_user = User::firstOrCreate(
            ['email' => 'conseiller@agrisuivi.fr'],
            [
                'name'               => 'Jean Conseiller',
                'password'           => 'password123',
                'email_verified_at'  => now(),
            ]
        );
        $conseiller_user->syncRoles(['Conseiller']);

        // Superviseur de test
        $sup_user = User::firstOrCreate(
            ['email' => 'superviseur@agrisuivi.fr'],
            [
                'name'               => 'Marie Superviseure',
                'password'           => 'password123',
                'email_verified_at'  => now(),
            ]
        );
        $sup_user->syncRoles(['Superviseur']);

        $this->command->info('✅ Rôles et permissions créés avec succès.');
        $this->command->table(
            ['Rôle', 'Permissions'],
            Role::with('permissions')->get()->map(fn ($r) => [
                $r->name,
                $r->permissions->count() . ' permission(s)',
            ])
        );
    }
}

<?php

use App\Models\Departement;
use App\Models\Commune;
use App\Models\Arrondissement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

/*
|--------------------------------------------------------------------------
| API Routes — PASAD Agronomy Platform
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {

    // Utilisateur connecté avec rôles & permissions
    Route::get('/user', function (Request $request) {
        $user = $request->user()->load([]);
        return response()->json([
            ...$user->toArray(),
            'roles'       => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    });

    // ── Communes et arrondissements du conseiller connecté ──────────────
    Route::get('/user/communes', function (Request $request) {
        $user = $request->user()->load(['communes.departement', 'communes.arrondissements']);
        $communes = $user->communes->map(fn ($c) => [
            'id'                 => $c->id,
            'nom'                => $c->nom,
            'departement'        => $c->departement,
            'arrondissements_count' => $c->arrondissements->count(),
        ]);
        return response()->json($communes->values());
    });

    // ── Statistiques du tableau de bord ────────────────────────────────
    Route::get('/dashboard/stats', function () {
        return response()->json([
            'utilisateurs' => User::count(),
            'producteurs'  => 0, // sera mis à jour quand le module sera créé
            'parcelles'    => 0, // sera mis à jour quand le module sera créé
            'suivis'       => 0, // sera mis à jour quand le module sera créé
            'rapports'     => 0, // sera mis à jour quand le module sera créé
        ]);
    });

    // ── Gestion des utilisateurs (admin+) ────────────────────────────────
    Route::middleware('role:Administrateur|Super-Admin')->group(function () {
        Route::get('/users', function () {
            $users = User::with('roles')->get()->map(fn ($u) => [
                ...$u->toArray(),
                'roles' => $u->getRoleNames(),
            ]);
            return response()->json($users->values());
        });

        Route::post('/users/{user}/roles', function (Request $request, User $user) {
            $request->validate(['role' => 'required|string|exists:roles,name']);
            $user->syncRoles([$request->role]);
            return response()->json(['success' => true, 'roles' => $user->getRoleNames()]);
        });
    });

    // ── Gestion des rôles (Super-Admin uniquement) ───────────────────────
    Route::middleware('role:Super-Admin')->group(function () {
        Route::get('/roles', function () {
            $roles = Role::with('permissions')->get()->map(fn ($r) => [
                'id'          => $r->id,
                'name'        => $r->name,
                'permissions' => $r->permissions->pluck('name')->values()->toArray(),
                'users_count' => User::role($r->name)->count(),
            ]);
            return response()->json($roles->values());
        });

        Route::get('/permissions', function () {
            $perms = Permission::orderBy('name')->get()->pluck('name');
            return response()->json($perms->values());
        });

        Route::put('/roles/{role}/permissions', function (Request $request, Role $role) {
            $request->validate([
                'permissions'   => 'required|array',
                'permissions.*' => 'string|exists:permissions,name',
            ]);
            $role->syncPermissions($request->permissions);
            return response()->json([
                'success'     => true,
                'permissions' => $role->permissions->pluck('name')->values()->toArray(),
            ]);
        });
    });

    // ── Données géographiques ───────────────────────────────────────────
    Route::get('/departements', function () {
        return Departement::orderBy('nom')->get();
    });

    Route::get('/departements/{departement}/communes', function (Departement $departement) {
        return $departement->communes()->orderBy('nom')->get();
    });

    Route::get('/communes/{commune}/arrondissements', function (Commune $commune) {
        return $commune->arrondissements()->orderBy('nom')->get();
    });

    Route::middleware('role:Super-Admin')->group(function () {
        Route::post('/departements', function (Request $request) {
            $validated = $request->validate([
                'code' => ['required', 'string', 'max:10', 'unique:departements,code'],
                'nom'  => ['required', 'string', 'max:255'],
            ]);

            return response()->json(Departement::create($validated), 201);
        });

        Route::put('/departements/{departement}', function (Request $request, Departement $departement) {
            $validated = $request->validate([
                'code' => ['required', 'string', 'max:10', Rule::unique('departements', 'code')->ignore($departement->id)],
                'nom'  => ['required', 'string', 'max:255'],
            ]);

            $departement->update($validated);
            return response()->json($departement->fresh());
        });

        Route::delete('/departements/{departement}', function (Departement $departement) {
            $departement->delete();
            return response()->json(['success' => true]);
        });

        Route::post('/communes', function (Request $request) {
            $validated = $request->validate([
                'departement_id' => ['required', 'exists:departements,id'],
                'nom'            => ['required', 'string', 'max:255'],
            ]);

            return response()->json(Commune::create($validated), 201);
        });

        Route::put('/communes/{commune}', function (Request $request, Commune $commune) {
            $validated = $request->validate([
                'departement_id' => ['required', 'exists:departements,id'],
                'nom'            => ['required', 'string', 'max:255'],
            ]);

            $commune->update($validated);
            return response()->json($commune->fresh());
        });

        Route::delete('/communes/{commune}', function (Commune $commune) {
            $commune->delete();
            return response()->json(['success' => true]);
        });

        Route::post('/arrondissements', function (Request $request) {
            $validated = $request->validate([
                'commune_id' => ['required', 'exists:communes,id'],
                'nom'        => ['required', 'string', 'max:255'],
            ]);

            return response()->json(Arrondissement::create($validated), 201);
        });

        Route::put('/arrondissements/{arrondissement}', function (Request $request, Arrondissement $arrondissement) {
            $validated = $request->validate([
                'commune_id' => ['required', 'exists:communes,id'],
                'nom'        => ['required', 'string', 'max:255'],
            ]);

            $arrondissement->update($validated);
            return response()->json($arrondissement->fresh());
        });

        Route::delete('/arrondissements/{arrondissement}', function (Arrondissement $arrondissement) {
            $arrondissement->delete();
            return response()->json(['success' => true]);
        });
    });

    // ── Création d'utilisateurs (admin+) ─────────────────────────────────
    Route::middleware('role:Administrateur|Superviseur|Super-Admin')->group(function () {
        Route::post('/users', function (Request $request) {
            $validated = $request->validate([
                'name'              => 'required|string|max:255',
                'email'             => 'required|email|unique:users,email',
                'role'              => 'required|string|exists:roles,name',
                'commune_ids'       => 'sometimes|array',
                'commune_ids.*'     => 'exists:communes,id',
                'arrondissement_ids'    => 'sometimes|array',
                'arrondissement_ids.*'  => 'exists:arrondissements,id',
            ]);

            // Générer un mot de passe aléatoire sécurisé
            $generatedPassword = Str::random(12) . rand(10, 99) . '!';

            $user = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'password' => Hash::make($generatedPassword),
            ]);

            $user->assignRole($validated['role']);

            // Si c'est un conseiller, affecter les communes et arrondissements
            if ($validated['role'] === 'Conseiller') {
                if (!empty($validated['commune_ids'])) {
                    $user->communes()->sync($validated['commune_ids']);
                }
                if (!empty($validated['arrondissement_ids'])) {
                    $user->arrondissements()->sync($validated['arrondissement_ids']);
                }
            }

            // Envoyer l'email avec les identifiants
            $user->notify(new \App\Notifications\UserCredentialsNotification(
                password: $generatedPassword,
                roleName: $validated['role']
            ));

            return response()->json([
                'success' => true,
                'user'    => [
                    ...$user->toArray(),
                    'roles'           => $user->getRoleNames(),
                    'communes'        => $user->communes,
                    'arrondissements' => $user->arrondissements,
                ],
            ], 201);
        });

        // Voir un utilisateur
        Route::get('/users/{user}', function (User $user) {
            return response()->json([
                ...$user->toArray(),
                'roles'           => $user->getRoleNames(),
                'communes'        => $user->communes,
                'arrondissements' => $user->arrondissements,
            ]);
        });

        // Modifier un utilisateur
        Route::put('/users/{user}', function (Request $request, User $user) {
            $validated = $request->validate([
                'name'  => 'required|string|max:255',
                'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
                'role'  => 'required|string|exists:roles,name',
            ]);

            $user->update([
                'name'  => $validated['name'],
                'email' => $validated['email'],
            ]);

            // Mettre à jour le rôle si modifié
            if ($user->getRoleNames()->first() !== $validated['role']) {
                $user->syncRoles([$validated['role']]);
            }

            return response()->json([
                'success' => true,
                'user'    => [
                    ...$user->toArray(),
                    'roles'           => $user->getRoleNames(),
                    'communes'        => $user->communes,
                    'arrondissements' => $user->arrondissements,
                ],
            ]);
        });

        // Réinitialiser le mot de passe
        Route::post('/users/{user}/reset-password', function (User $user) {
            $newPassword = Str::random(12) . rand(10, 99) . '!';
            $user->update(['password' => Hash::make($newPassword)]);

            $user->notify(new \App\Notifications\PasswordResetNotification(
                password: $newPassword
            ));

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé et envoyé par email.',
            ]);
        });

        // Bloquer un compte
        Route::post('/users/{user}/block', function (Request $request, User $user) {
            $validated = $request->validate(['reason' => 'nullable|string|max:255']);

            $user->update([
                'is_blocked'     => true,
                'blocked_at'     => now(),
                'blocked_reason' => $validated['reason'] ?? null,
            ]);

            return response()->json(['success' => true, 'message' => 'Compte bloqué.']);
        });

        // Débloquer un compte
        Route::post('/users/{user}/unblock', function (User $user) {
            $user->update([
                'is_blocked'     => false,
                'blocked_at'     => null,
                'blocked_reason' => null,
            ]);

            return response()->json(['success' => true, 'message' => 'Compte débloqué.']);
        });

        // Suspendre un compte
        Route::post('/users/{user}/suspend', function (Request $request, User $user) {
            $validated = $request->validate(['reason' => 'nullable|string|max:255']);

            $user->update([
                'is_suspended'     => true,
                'suspended_at'     => now(),
                'suspended_reason' => $validated['reason'] ?? null,
            ]);

            return response()->json(['success' => true, 'message' => 'Compte suspendu.']);
        });

        // Réactiver un compte suspendu
        Route::post('/users/{user}/unsuspend', function (User $user) {
            $user->update([
                'is_suspended'     => false,
                'suspended_at'     => null,
                'suspended_reason' => null,
            ]);

            return response()->json(['success' => true, 'message' => 'Compte réactivé.']);
        });

        // Geler un compte
        Route::post('/users/{user}/freeze', function (Request $request, User $user) {
            $validated = $request->validate(['reason' => 'nullable|string|max:255']);

            $user->update([
                'is_frozen'     => true,
                'frozen_at'     => now(),
                'frozen_reason' => $validated['reason'] ?? null,
            ]);

            return response()->json(['success' => true, 'message' => 'Compte gelé.']);
        });

        // Dégeler un compte
        Route::post('/users/{user}/unfreeze', function (User $user) {
            $user->update([
                'is_frozen'     => false,
                'frozen_at'     => null,
                'frozen_reason' => null,
            ]);

            return response()->json(['success' => true, 'message' => 'Compte dégelé.']);
        });
    });

    // ── Profil Historique ───────────────────────────────────────────────
    Route::get('/hierarchisation-domaines-activites/villages', [App\Http\Controllers\HierarchisationDomaineActiviteController::class, 'villages']);
    Route::patch('/matrice-problemes-solutions/solutions/{solution}/status', [App\Http\Controllers\MatriceProblemeSolutionController::class, 'updateSolutionStatus']);
    Route::patch('/matrice-problemes-solutions/problemes/{probleme}/pertinence', [App\Http\Controllers\MatriceProblemeSolutionController::class, 'updateProblemPertinence']);
    Route::resource('matrice-problemes-solutions', App\Http\Controllers\MatriceProblemeSolutionController::class)->only(['index', 'store']);
    Route::get('/curriculum-apprentissage-cep/problemes-pertinents', [App\Http\Controllers\CurriculumApprentissageCepController::class, 'problemesPertinents']);
    Route::resource('curriculum-apprentissage-cep', App\Http\Controllers\CurriculumApprentissageCepController::class)->only(['index', 'store']);
    Route::resource('hierarchisation-domaines-activites', App\Http\Controllers\HierarchisationDomaineActiviteController::class)->only(['index', 'store']);
    Route::resource('hierarchisation-speculations-agricoles', App\Http\Controllers\HierarchisationSpeculationAgricoleController::class)->only(['index', 'store']);
    Route::resource('profil-historique', App\Http\Controllers\ProfilHistoriqueController::class);
    Route::resource('liste-presence-sensibilisation', App\Http\Controllers\ListePresenceSensibilisationController::class)->only(['index', 'store']);
    Route::get('/resume-protocoles-experimentations/problemes', [App\Http\Controllers\ResumeProtocoleExperimentationController::class, 'problemesDisponibles']);
    Route::resource('resume-protocoles-experimentations', App\Http\Controllers\ResumeProtocoleExperimentationController::class)->only(['index', 'store']);
    Route::get('/identification-participants-cep/from-sensibilisation', [App\Http\Controllers\IdentificationParticipantCepController::class, 'fromSensibilisation']);
    Route::resource('identification-participants-cep', App\Http\Controllers\IdentificationParticipantCepController::class)->only(['index', 'store']);

    // ── Animation sessions CEP ───────────────────────────────────────────
    Route::get('/animation-sessions-cep/experimentations', [App\Http\Controllers\AnimationSessionCepController::class, 'experimentationsDisponibles']);
    Route::resource('animation-sessions-cep', App\Http\Controllers\AnimationSessionCepController::class)->only(['index', 'store']);

    // ── Gestion des CEP ──────────────────────────────────────────────────
    Route::get('/cep/{cep}/membres-disponibles', [App\Http\Controllers\CepController::class, 'membresDisponibles']);
    Route::post('/cep/{cep}/membres', [App\Http\Controllers\CepController::class, 'addMembre']);
    Route::delete('/cep/{cep}/membres/{membre}', [App\Http\Controllers\CepController::class, 'removeMembre']);
    Route::resource('cep', App\Http\Controllers\CepController::class)->only(['index', 'store', 'destroy']);
});

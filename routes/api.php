<?php

use App\Models\AppVersion;
use App\Models\Departement;
use App\Models\Commune;
use App\Models\Arrondissement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

/*
|--------------------------------------------------------------------------
| API Routes — PARSAD Agronomy Platform
|--------------------------------------------------------------------------
*/

// ── Vérification version applicative (public, pas d'auth requise) ──────
Route::get('/app/version-check', function (Request $request) {
    try {
        $config = AppVersion::current();
    } catch (\Exception) {
        // Table pas encore créée ou vide : on laisse passer
        return response()->json(['needs_update' => false, 'force_update' => false]);
    }

    $appVersion = $request->header('X-App-Version', '0.0.0');
    $needsUpdate = version_compare($appVersion, $config->min_version, '<');

    return response()->json([
        'needs_update'    => $needsUpdate,
        'force_update'    => $config->force_update,
        'min_version'     => $config->min_version,
        'latest_version'  => $config->latest_version,
        'android_url'     => $config->android_url,
        'ios_url'         => $config->ios_url,
        'release_notes'   => $config->release_notes,
        // La preuve : la version envoyée par l'app est comparée ici
        'app_version_received' => $appVersion,
    ]);
});

// ── Authentification mobile (token Sanctum) ────────────────────────────
Route::middleware(['throttle:5,1'])->group(function () {

    Route::post('/mobile/login', function (Request $request) {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        foreach (['blocked' => 'bloqué', 'suspended' => 'suspendu', 'frozen' => 'gelé'] as $key => $label) {
            if ($user->{"is_$key"}) {
                $reason = $user->{"{$key}_reason"};
                return response()->json([
                    'message' => "Compte $label" . ($reason ? " : $reason" : '.'),
                ], 403);
            }
        }

        // Révoquer les anciens tokens mobiles avant d'en créer un nouveau
        $user->tokens()->where('name', 'mobile')->delete();

        $token = $user->createToken('mobile', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'telephone'   => $user->telephone,
                'roles'       => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    });

});

Route::middleware(['auth:sanctum'])->group(function () {

    // Mobile : déconnexion
    Route::post('/mobile/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès.']);
    });

    // Utilisateur connecté avec rôles & permissions
    Route::get('/user', function (Request $request) {
        $user = $request->user()->load([]);
        return response()->json([
            ...$user->toArray(),
            'roles'       => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    });

    // ── Profil : modifier les informations personnelles ─────────────────
    Route::put('/me', function (Request $request) {
        $user = $request->user();
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'telephone' => ['nullable', 'string', 'max:50'],
        ]);
        $user->update($validated);
        return response()->json([
            ...$user->fresh()->toArray(),
            'roles'       => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    });

    // ── Profil : changer le mot de passe ────────────────────────────────
    Route::put('/me/password', function (Request $request) {
        $user = $request->user();
        $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'password'         => ['required', 'string', 'confirmed', Password::min(8)],
        ]);
        $user->update(['password' => Hash::make($request->password)]);
        return response()->json(['message' => 'Mot de passe mis à jour.']);
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
    Route::get('/dashboard/stats', App\Http\Controllers\DashboardStatsController::class);

    // ── Export des données (CSV / XLSX / PDF) ───────────────────────────
    Route::middleware('permission:rapports.exporter')->group(function () {
        Route::get('/exports/datasets', [App\Http\Controllers\DataExportController::class, 'datasets']);
        Route::post('/exports', [App\Http\Controllers\DataExportController::class, 'queueExport']);
        Route::get('/exports/download', [App\Http\Controllers\DataExportController::class, 'export']);
        Route::get('/exports/download-group', [App\Http\Controllers\DataExportController::class, 'exportGroup']);
        Route::get('/exports/{dataExport}', [App\Http\Controllers\DataExportController::class, 'exportStatus']);
        Route::get('/exports/{dataExport}/download', [App\Http\Controllers\DataExportController::class, 'downloadQueuedExport'])
            ->name('data-exports.download');
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
    Route::get('/profil-historique/village-evenements', [App\Http\Controllers\ProfilHistoriqueController::class, 'villageEvenements']);
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
    Route::get('/resume-protocoles-experimentations/sujets-speciaux', [App\Http\Controllers\ResumeProtocoleExperimentationController::class, 'sujetsSpeciaux']);
    Route::get('/resume-protocoles-experimentations/titres-experimentation', [App\Http\Controllers\ResumeProtocoleExperimentationController::class, 'titresExperimentation']);
    Route::get('/resume-protocoles-experimentations/dispositifs-experimentaux', [App\Http\Controllers\ResumeProtocoleExperimentationController::class, 'dispositifsExperimentaux']);
    Route::resource('resume-protocoles-experimentations', App\Http\Controllers\ResumeProtocoleExperimentationController::class)->only(['index', 'store']);
    Route::get('/identification-participants-cep/from-sensibilisation', [App\Http\Controllers\IdentificationParticipantCepController::class, 'fromSensibilisation']);
    Route::resource('identification-participants-cep', App\Http\Controllers\IdentificationParticipantCepController::class)->only(['index', 'store']);

    // ── Animation sessions CEP ───────────────────────────────────────────
    Route::get('/animation-sessions-cep/experimentations', [App\Http\Controllers\AnimationSessionCepController::class, 'experimentationsDisponibles']);
    Route::resource('animation-sessions-cep', App\Http\Controllers\AnimationSessionCepController::class)->only(['index', 'store']);
    Route::get('/base-beneficiaires-intervention/participants', [App\Http\Controllers\BaseBeneficiaireInterventionController::class, 'participantsDisponibles']);
    Route::resource('base-beneficiaires-intervention', App\Http\Controllers\BaseBeneficiaireInterventionController::class)->only(['index', 'store']);

    // ── Bilan sessions animation CEP ─────────────────────────────────────
    Route::resource('bilan-sessions-animation-cep', App\Http\Controllers\BilanSessionAnimationCepController::class)->only(['index', 'store']);
    Route::resource('organisation-visites-echanges', App\Http\Controllers\OrganisationVisiteEchangeController::class)->only(['index', 'store']);
    Route::resource('visites-echanges-commentees', App\Http\Controllers\VisiteEchangeCommenteeController::class)->only(['index', 'store']);
    Route::resource('difficultes-suggestions', App\Http\Controllers\DifficulteSuggestionController::class)->only(['index', 'store']);
    Route::resource('evolution-rendements-cep', App\Http\Controllers\EvolutionRendementCepController::class)->only(['index', 'store']);
    Route::resource('rendement-dispositif', App\Http\Controllers\RendementDispositifController::class)->only(['index', 'store']);
    Route::resource('rapport-demarrage-cep', App\Http\Controllers\RapportDemarrageCepController::class)->only(['index', 'store']);

    // ── Statistiques CEP ─────────────────────────────────────────────────
    Route::get('/stats/cep', App\Http\Controllers\CepStatsController::class);

    // ── Gestion des versions applicatives (Super-Admin) ──────────────────
    Route::middleware('role:Super-Admin')->group(function () {
        Route::get('/app/version', function () {
            return response()->json(AppVersion::current());
        });

        Route::put('/app/version', function (Request $request) {
            $validated = $request->validate([
                'min_version'    => ['required', 'string', 'max:20', 'regex:/^\d+\.\d+\.\d+$/'],
                'latest_version' => ['required', 'string', 'max:20', 'regex:/^\d+\.\d+\.\d+$/'],
                'force_update'   => ['required', 'boolean'],
                'android_url'    => ['nullable', 'url', 'max:500'],
                'ios_url'        => ['nullable', 'url', 'max:500'],
                'release_notes'  => ['nullable', 'string', 'max:2000'],
            ]);

            // On ne garde qu'un seul enregistrement — on le met à jour
            try {
                $config = AppVersion::current();
            } catch (\Exception) {
                $config = new AppVersion();
            }

            $config->fill([...$validated, 'published_by' => $request->user()->id]);
            $config->save();

            return response()->json(['success' => true, 'config' => $config->fresh()]);
        });
    });

    // ── Gestion des CEP ──────────────────────────────────────────────────
    Route::get('/cep/{cep}/membres-disponibles', [App\Http\Controllers\CepController::class, 'membresDisponibles']);
    Route::post('/cep/{cep}/membres', [App\Http\Controllers\CepController::class, 'addMembre']);
    Route::delete('/cep/{cep}/membres/{membre}', [App\Http\Controllers\CepController::class, 'removeMembre']);
    Route::resource('cep', App\Http\Controllers\CepController::class)->only(['index', 'store', 'destroy']);

    // ── CAI (Conseil Agricole Intégré) ───────────────────────────────────
    // Phase 1 / Étape 1 — Liste des producteurs prêts à s'engager dans le CAI
    Route::get('/cai/liste-producteurs',  [App\Http\Controllers\CaiListeProducteurController::class, 'index']);
    Route::post('/cai/liste-producteurs', [App\Http\Controllers\CaiListeProducteurController::class, 'store']);
    Route::put('/cai/liste-producteurs/{producteur}', [App\Http\Controllers\CaiListeProducteurController::class, 'update']);

    // Phase 1 / Étape 1 — Liste des organisations, coopératives, groupes de producteurs
    Route::get('/cai/liste-organisations',  [App\Http\Controllers\CaiListeOrganisationController::class, 'index']);
    Route::post('/cai/liste-organisations', [App\Http\Controllers\CaiListeOrganisationController::class, 'store']);
    Route::put('/cai/liste-organisations/{organisation}', [App\Http\Controllers\CaiListeOrganisationController::class, 'update']);

    // Phase 1 / Étape 2 — Négociation de l'accord CAI (CTS-PV/AE et CAM)
    Route::get('/cai/negociation-accord',  [App\Http\Controllers\CaiNegociationAccordController::class, 'index']);
    Route::post('/cai/negociation-accord', [App\Http\Controllers\CaiNegociationAccordController::class, 'store']);
    Route::put('/cai/negociation-accord/{ligne}', [App\Http\Controllers\CaiNegociationAccordController::class, 'update']);

    // Phase 2 / Étape 3 — Caractérisation des marchés de produits agroécologiques
    Route::get('/cai/marches-caracterisation',  [App\Http\Controllers\CaiMarcheCaracterisationController::class, 'index']);
    Route::post('/cai/marches-caracterisation', [App\Http\Controllers\CaiMarcheCaracterisationController::class, 'store']);

    // Phase 2 / Étape 4 — Identification des facteurs limitant l'accès aux marchés (FFOM)
    Route::get('/cai/facteurs-limitant',  [App\Http\Controllers\CaiFacteurLimitantController::class, 'index']);
    Route::post('/cai/facteurs-limitant', [App\Http\Controllers\CaiFacteurLimitantController::class, 'store']);

    // Phase 2 / Étape 5 — Fiche de synthèse d'une étude de marché
    Route::get('/cai/etude-marche',  [App\Http\Controllers\CaiEtudeMarcheController::class, 'index']);
    Route::post('/cai/etude-marche', [App\Http\Controllers\CaiEtudeMarcheController::class, 'store']);

    // Phase 2 / Étape 6 — Principes de production agroécologique (Oui/Non par producteur)
    Route::get('/cai/agroecologie-producteurs',  [App\Http\Controllers\CaiAgroecologieProducteursController::class, 'index']);
    Route::post('/cai/agroecologie-producteurs', [App\Http\Controllers\CaiAgroecologieProducteursController::class, 'store']);

    // Phase 2 / Étape 9 — Compte Prévisionnel de Mise en marché
    Route::get('/cai/appui-marche',  [App\Http\Controllers\CaiAppuiMarcheController::class, 'index']);
    Route::post('/cai/appui-marche', [App\Http\Controllers\CaiAppuiMarcheController::class, 'store']);

    // Phase 2 / Étape 10 — Programmation de la mise en marché (tableau Mois × Décades)
    Route::get('/cai/programmation-marche',  [App\Http\Controllers\CaiProgrammationMarcheController::class, 'index']);
    Route::post('/cai/programmation-marche', [App\Http\Controllers\CaiProgrammationMarcheController::class, 'store']);

    // Phase 4 / Étape 13 — Accompagnement technique (Programme de quinzaine)
    Route::get('/cai/programme-quinzaine',  [App\Http\Controllers\CaiProgrammeQuinzaineController::class, 'index']);
    Route::post('/cai/programme-quinzaine', [App\Http\Controllers\CaiProgrammeQuinzaineController::class, 'store']);

    // Phase 4 / Étape 14 — Suivi des mouvements d'argent dans la caisse (Journal de caisse)
    Route::get('/cai/journal-caisse',  [App\Http\Controllers\CaiJournalCaisseController::class, 'index']);
    Route::post('/cai/journal-caisse', [App\Http\Controllers\CaiJournalCaisseController::class, 'store']);

    // Phase 4 / Étape 15 — Suivi des mouvements de stock d'intrants et de produits agricoles
    Route::get('/cai/fiche-stock',  [App\Http\Controllers\CaiFicheStockController::class, 'index']);
    Route::post('/cai/fiche-stock', [App\Http\Controllers\CaiFicheStockController::class, 'store']);

    // Phase 5 / Étape 16 — Évaluation technique de la production agroécologique (Évolution des rendements CEP)
    Route::get('/cai/evolution-rendements-cep',  [App\Http\Controllers\CaiEvolutionRendementsCepController::class, 'index']);
    Route::post('/cai/evolution-rendements-cep', [App\Http\Controllers\CaiEvolutionRendementsCepController::class, 'store']);

    // Phase 5 / Étape 17 — Évolution des rendements des UD (Unités de Démonstration)
    Route::get('/cai/evolution-rendements-ud',  [App\Http\Controllers\CaiEvolutionRendementsUdController::class, 'index']);
    Route::post('/cai/evolution-rendements-ud', [App\Http\Controllers\CaiEvolutionRendementsUdController::class, 'store']);

    // Phase 5 / Étape 18 — Évolution des quantités de produits chimiques de synthèse utilisés
    Route::get('/cai/evolution-produits-chimiques',  [App\Http\Controllers\CaiEvolutionProduitsChimiquesController::class, 'index']);
    Route::post('/cai/evolution-produits-chimiques', [App\Http\Controllers\CaiEvolutionProduitsChimiquesController::class, 'store']);

    // Phase 5 / Étape 19 — Évolution des quantités de produits organiques utilisés
    Route::get('/cai/evolution-produits-organiques',  [App\Http\Controllers\CaiEvolutionProduitsOrganiquesController::class, 'index']);
    Route::post('/cai/evolution-produits-organiques', [App\Http\Controllers\CaiEvolutionProduitsOrganiquesController::class, 'store']);

    // Phase 5 / Étape 20 — Évolution du nombre d'espèces animales et végétales cultivées
    Route::get('/cai/evolution-especes',  [App\Http\Controllers\CaiEvolutionEspecesController::class, 'index']);
    Route::post('/cai/evolution-especes', [App\Http\Controllers\CaiEvolutionEspecesController::class, 'store']);

    // Phase 5 / Étape 21 — Analyse de la qualité des sols
    Route::get('/cai/analyse-qualite-sols',  [App\Http\Controllers\CaiAnalyseQualiteSolsController::class, 'index']);
    Route::post('/cai/analyse-qualite-sols', [App\Http\Controllers\CaiAnalyseQualiteSolsController::class, 'store']);

    // Phase 5 / Étape 22 — Coût de transaction, Marge brute et Marge nette
    Route::get('/cai/cout-transaction',  [App\Http\Controllers\CaiCoutTransactionController::class, 'index']);
    Route::post('/cai/cout-transaction', [App\Http\Controllers\CaiCoutTransactionController::class, 'store']);

    // Phase 5 / Étape 23 — Évaluation institutionnelle
    Route::get('/cai/evaluation-institutionnelle',  [App\Http\Controllers\CaiEvaluationInstitutionnelleController::class, 'index']);
    Route::post('/cai/evaluation-institutionnelle', [App\Http\Controllers\CaiEvaluationInstitutionnelleController::class, 'store']);

    // Phase 5 / Étape 24 — Évaluation organisationnelle
    Route::get('/cai/evaluation-organisationnelle',  [App\Http\Controllers\CaiEvaluationOrganisationnelleController::class, 'index']);
    Route::post('/cai/evaluation-organisationnelle', [App\Http\Controllers\CaiEvaluationOrganisationnelleController::class, 'store']);

    // Phase 5 / Étape 25 — Évaluation sociale de la mise en marché
    Route::get('/cai/evaluation-sociale',  [App\Http\Controllers\CaiEvaluationSocialeController::class, 'index']);
    Route::post('/cai/evaluation-sociale', [App\Http\Controllers\CaiEvaluationSocialeController::class, 'store']);
});

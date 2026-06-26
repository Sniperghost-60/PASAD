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
| API Routes — PASAD Agronomy Platform
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
    Route::get('/dashboard/stats', function (Request $request) {
        $user      = $request->user();
        $uid       = $user->id;
        $isAdmin   = $user->hasAnyRole(['Super-Admin', 'Administrateur', 'Superviseur']);
        $communeId = $request->filled('commune_id') ? (int) $request->input('commune_id') : null;

        // IDs des CEP appartenant à la commune sélectionnée (pour filtrer les sous-tables)
        $cepIds = null;
        if ($communeId) {
            $cepQuery = DB::table('cep')->where('commune_id', $communeId);
            if (!$isAdmin) $cepQuery->where('user_id', $uid);
            $cepIds = $cepQuery->pluck('id')->toArray();
        }

        // Tables filtrables par commune_id directement
        $byCommune = [
            'profil_historique',
            'hierarchisation_domaines_activites',
            'hierarchisation_speculations_agricoles',
            'matrice_problemes',
            'curriculum_apprentissage_cep',
            'resume_protocoles_experimentations',
            'identification_participants_cep',
            'liste_presence_sensibilisation',
            'base_beneficiaires_intervention',
        ];
        // Tables filtrables par cep_id
        $byCepId   = ['animation_sessions_cep', 'bilan_sessions_animation_cep',
                      'organisation_visites_echanges', 'visites_echanges_commentees',
                      'difficultes_suggestions', 'evolution_rendements_cep',
                      'rendement_dispositif', 'rapport_demarrage_cep'];

        $tables = [
            'profil_historique', 'hierarchisation_domaines_activites',
            'hierarchisation_speculations_agricoles', 'matrice_problemes',
            'curriculum_apprentissage_cep', 'resume_protocoles_experimentations',
            'liste_presence_sensibilisation', 'identification_participants_cep',
            'cep', 'animation_sessions_cep', 'base_beneficiaires_intervention',
            'bilan_sessions_animation_cep', 'organisation_visites_echanges',
            'visites_echanges_commentees', 'difficultes_suggestions',
            'evolution_rendements_cep', 'rendement_dispositif', 'rapport_demarrage_cep',
        ];

        $applyScope = function ($query, string $table) use ($isAdmin, $uid, $communeId, $cepIds, $byCommune, $byCepId) {
            if (!$isAdmin) $query->where('user_id', $uid);
            if ($communeId) {
                if ($table === 'cep') {
                    $query->where('commune_id', $communeId);
                } elseif (in_array($table, $byCommune)) {
                    $query->where('commune_id', $communeId);
                } elseif (in_array($table, $byCepId) && $cepIds !== null) {
                    $query->whereIn('cep_id', $cepIds);
                }
            }
            return $query;
        };

        $qAll  = fn($t) => DB::table($t)->count();
        $q     = fn($t) => $applyScope(DB::table($t), $t)->count();
        $qFn   = $isAdmin && !$communeId ? $qAll : $q;

        $stats = collect($tables)->mapWithKeys(fn($t) => [$t => $qFn($t)])->all();

        $stats['utilisateurs'] = User::count();
        $stats['communes']     = DB::table('communes')->count();
        $stats['cep_membres']  = DB::table('cep_membres')->count();

        // Helper: scope une query par user + commune (commune_id direct)
        $scopeByCommune = function ($query) use ($isAdmin, $uid, $communeId) {
            if (!$isAdmin) $query->where('user_id', $uid);
            if ($communeId) $query->where('commune_id', $communeId);
            return $query;
        };

        // Helper: scope une query par user + cep_id (tables liées aux CEP)
        $scopeByCep = function ($query) use ($isAdmin, $uid, $cepIds) {
            if (!$isAdmin) $query->where('user_id', $uid);
            if ($cepIds !== null) $query->whereIn('cep_id', $cepIds);
            return $query;
        };

        // ── Stats scoped ─────────────────────────────────────────────────────
        // Taux féminisation participants CEP
        $totalPart  = $scopeByCommune(DB::table('identification_participants_cep'))->count();
        $femmesPart = $scopeByCommune(DB::table('identification_participants_cep'))->where('sexe', 'F')->count();
        $stats['taux_feminisation']   = $totalPart > 0 ? round($femmesPart / $totalPart * 100, 1) : 0;
        $stats['participants_femmes'] = $femmesPart;
        $stats['participants_hommes'] = $totalPart - $femmesPart;

        // Top 5 spéculations pratiquées
        $stats['top_speculations'] = $scopeByCommune(DB::table('identification_participants_cep'))
            ->whereNotNull('speculation')->where('speculation', '!=', '')
            ->selectRaw('speculation, COUNT(*) as nb')
            ->groupBy('speculation')->orderByDesc('nb')->limit(5)->get();

        // Catégories d'âge
        $stats['categories_age'] = $scopeByCommune(DB::table('identification_participants_cep'))
            ->whereNotNull('categorie_age')
            ->selectRaw('categorie_age, COUNT(*) as nb')
            ->groupBy('categorie_age')->orderByDesc('nb')->get();

        // Superficie couverte totale (ha)
        $stats['superficie_couverte_total'] = (float) $scopeByCep(DB::table('animation_sessions_cep'))
            ->sum('superficie_couverte');

        // Totaux AAES & tests à l'urne
        $stats['nb_aaes_total']      = (int) $scopeByCep(DB::table('bilan_sessions_animation_cep'))->sum('nb_aaes');
        $stats['nb_test_urne_total'] = (int) $scopeByCep(DB::table('bilan_sessions_animation_cep'))->sum('nb_test_urne');

        // Bilan H/F/jeunes cumulé
        $bilan = $scopeByCep(DB::table('bilan_sessions_animation_cep'))
            ->selectRaw('SUM(participation_total) as total, SUM(participation_h) as hommes, SUM(participation_f) as femmes, SUM(participation_jeunes) as jeunes')
            ->first();
        $stats['bilan_participation'] = $bilan;

        // Top pratiques agroécologiques
        $pratiquesMap = [];
        foreach (['pratique_agroecologique_1','pratique_agroecologique_2','pratique_agroecologique_3'] as $col) {
            $scopeByCommune(DB::table('base_beneficiaires_intervention'))
                ->whereNotNull($col)->where($col, '!=', '')
                ->selectRaw("$col as pratique, COUNT(*) as nb")
                ->groupBy($col)->get()
                ->each(fn($r) => $pratiquesMap[$r->pratique] = ($pratiquesMap[$r->pratique] ?? 0) + $r->nb);
        }
        arsort($pratiquesMap);
        $stats['top_pratiques_agroeco'] = collect(array_slice($pratiquesMap, 0, 6, true))
            ->map(fn($nb, $pratique) => ['pratique' => $pratique, 'nb' => $nb])->values();

        // Répartition type producteur
        $stats['producteurs_par_type'] = $scopeByCommune(DB::table('base_beneficiaires_intervention'))
            ->whereNotNull('type_producteur')
            ->selectRaw('type_producteur, COUNT(*) as nb')
            ->groupBy('type_producteur')->get();

        // Top 5 difficultés signalées
        $stats['top_difficultes'] = $scopeByCep(DB::table('difficultes_suggestions'))
            ->whereNotNull('difficulte')->where('difficulte', '!=', '')
            ->selectRaw('difficulte, COUNT(*) as nb')
            ->groupBy('difficulte')->orderByDesc('nb')->limit(5)->get();

        // Progression mensuelle des saisies (12 derniers mois — proxy : profil_historique)
        $stats['progression_mensuelle'] = DB::table('profil_historique')
            ->when(!$isAdmin, fn($q) => $q->where('user_id', $uid))
            ->where('created_at', '>=', now()->subMonths(12))
            ->selectRaw("TO_CHAR(created_at, 'YYYY-MM') as mois, COUNT(*) as nb")
            ->groupBy('mois')->orderBy('mois')->get();

        // ── Stats réservées Superviseur / Admin ───────────────────────────
        // Répartition des utilisateurs par rôle (admins uniquement)
        if ($isAdmin) {
            $stats['users_par_role'] = [
                'Super-Admin'    => User::role('Super-Admin')->count(),
                'Administrateur' => User::role('Administrateur')->count(),
                'Superviseur'    => User::role('Superviseur')->count(),
                'Conseiller'     => User::role('Conseiller')->count(),
            ];

            // Top 5 conseillers les plus actifs (par nb de CEP créés)
            $stats['top_conseillers'] = DB::table('cep')
                ->join('users', 'users.id', '=', 'cep.user_id')
                ->selectRaw('users.id, users.name, COUNT(cep.id) as nb_cep')
                ->groupBy('users.id', 'users.name')
                ->orderByDesc('nb_cep')
                ->limit(5)
                ->get();

            // Activité globale : nb d'enregistrements par conseiller (profil historique)
            $stats['activite_conseillers'] = DB::table('profil_historique')
                ->join('users', 'users.id', '=', 'profil_historique.user_id')
                ->selectRaw('users.id, users.name, COUNT(*) as nb')
                ->groupBy('users.id', 'users.name')
                ->orderByDesc('nb')
                ->limit(8)
                ->get();

            // Taux CEP avec rapport de démarrage
            $nbCepTotal    = DB::table('cep')->count();
            $nbAvecRapport = DB::table('rapport_demarrage_cep')->count();
            $stats['taux_cep_avec_rapport'] = $nbCepTotal > 0 ? round($nbAvecRapport / $nbCepTotal * 100, 1) : 0;
            $stats['nb_avec_rapport']        = $nbAvecRapport;

            // CEP avec/sans comité en place
            $stats['cep_avec_comite'] = DB::table('rapport_demarrage_cep')->where('comite_en_place', true)->count();
            $stats['cep_sans_comite'] = DB::table('rapport_demarrage_cep')->where('comite_en_place', false)->count();

            // Arrondissements sans CEP actif
            $arrAvecCep = DB::table('cep')->whereNotNull('arrondissement_id')->distinct()->pluck('arrondissement_id');
            $stats['arrondissements_sans_cep'] = DB::table('arrondissements')->whereNotIn('id', $arrAvecCep)->count();
            $stats['arrondissements_total']    = DB::table('arrondissements')->count();

            // Gain rendement moyen % (technologie vs témoin) par culture
            $stats['gain_rendement'] = DB::table('rendement_dispositif')
                ->whereNotNull('rendement_annee_n_technologie')
                ->whereNotNull('rendement_annee_n_temoin')
                ->where('rendement_annee_n_temoin', '>', 0)
                ->whereNotNull('culture_technologie')
                ->selectRaw("culture_technologie as culture,
                    ROUND(AVG((rendement_annee_n_technologie - rendement_annee_n_temoin) / rendement_annee_n_temoin * 100)::numeric, 1) as gain_pct,
                    COUNT(*) as nb_producteurs")
                ->groupBy('culture_technologie')->orderByDesc('gain_pct')->limit(6)->get();

            // Producteurs uniques (dédupliqués par contact)
            $stats['producteurs_uniques'] = DB::table('base_beneficiaires_intervention')
                ->whereNotNull('contact1_producteur')
                ->distinct('contact1_producteur')
                ->count('contact1_producteur');

            // Évolution annuelle des profils CEP
            $stats['evolution_annuelle_cep'] = DB::table('profil_historique')
                ->whereNotNull('annee')
                ->selectRaw('annee::text as annee, COUNT(*) as nb')
                ->groupBy('annee')->orderBy('annee')->get();

            // Comptes par statut
            $stats['comptes_par_statut'] = [
                'actifs'    => User::where('is_blocked', false)->where('is_suspended', false)->where('is_frozen', false)->count(),
                'bloques'   => User::where('is_blocked', true)->count(),
                'suspendus' => User::where('is_suspended', true)->count(),
                'geles'     => User::where('is_frozen', true)->count(),
            ];

            // Conseillers inactifs ce mois (aucune saisie dans profil_historique)
            $actifsCeMois = DB::table('profil_historique')
                ->where('created_at', '>=', now()->startOfMonth())
                ->distinct()->pluck('user_id');
            $stats['conseillers_inactifs_mois'] = User::role('Conseiller')
                ->whereNotIn('id', $actifsCeMois)->count();

            // Pipeline problèmes → solutions → expérimentations
            $stats['nb_problemes_total']     = DB::table('matrice_problemes')->count();
            $stats['nb_problemes_pertinents']= DB::table('matrice_problemes')->where('est_pertinent', true)->count();
            $stats['nb_avec_curriculum']     = DB::table('curriculum_apprentissage_cep')->distinct('matrice_probleme_id')->count('matrice_probleme_id');
            $stats['nb_experimentations']    = DB::table('resume_protocoles_experimentations')->count();

            // Classement conseillers par activité totale (toutes tables)
            $conseillerIds = User::role('Conseiller')->pluck('id');
            if ($conseillerIds->isNotEmpty()) {
                $allTablesU = [
                    'profil_historique','hierarchisation_domaines_activites',
                    'hierarchisation_speculations_agricoles','matrice_problemes',
                    'curriculum_apprentissage_cep','resume_protocoles_experimentations',
                    'liste_presence_sensibilisation','identification_participants_cep',
                    'animation_sessions_cep','base_beneficiaires_intervention',
                    'bilan_sessions_animation_cep','organisation_visites_echanges',
                    'visites_echanges_commentees','difficultes_suggestions',
                    'evolution_rendements_cep','rendement_dispositif','rapport_demarrage_cep',
                ];
                $unionSql = collect($allTablesU)->map(fn($t) => "SELECT user_id FROM {$t}")->implode(' UNION ALL ');
                $idList   = $conseillerIds->implode(',');
                $stats['classement_conseillers'] = DB::select("
                    SELECT u.id, u.name, COUNT(a.user_id) as total_activite
                    FROM users u
                    LEFT JOIN ({$unionSql}) a ON a.user_id = u.id
                    WHERE u.id IN ({$idList})
                    GROUP BY u.id, u.name
                    ORDER BY total_activite DESC
                    LIMIT 8
                ");
            } else {
                $stats['classement_conseillers'] = [];
            }
        }

        return response()->json($stats);
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
    Route::get('/stats/cep', function (Request $request) {
        $user    = $request->user();
        $uid     = $user->id;
        $isAdmin = $user->hasAnyRole(['Super-Admin', 'Administrateur', 'Superviseur']);
        $scope   = fn($q) => $isAdmin ? $q : $q->where('user_id', $uid);

        // 1. Participants par commune (H/F)
        $participantsQuery = DB::table('identification_participants_cep as i')
            ->leftJoin('communes as c', 'c.id', '=', 'i.commune_id')
            ->selectRaw("COALESCE(c.nom,'Inconnue') as commune,
                COUNT(*) as total,
                SUM(CASE WHEN i.sexe='M' THEN 1 ELSE 0 END) as hommes,
                SUM(CASE WHEN i.sexe='F' THEN 1 ELSE 0 END) as femmes")
            ->groupBy('c.id', 'c.nom');
        if (!$isAdmin) $participantsQuery->where('i.user_id', $uid);
        $participants = $participantsQuery->orderByDesc('total')->limit(10)->get();

        // 2. Répartition H/F globale (pour camembert)
        $repartitionHF = [
            'hommes' => DB::table('identification_participants_cep')
                ->when(!$isAdmin, fn($q) => $q->where('user_id', $uid))
                ->where('sexe', 'M')->count(),
            'femmes' => DB::table('identification_participants_cep')
                ->when(!$isAdmin, fn($q) => $q->where('user_id', $uid))
                ->where('sexe', 'F')->count(),
        ];

        // 3. Rendements par culture (n-1 / technologie / témoin)
        $rendementsQuery = DB::table('rendement_dispositif')
            ->selectRaw("culture_technologie as culture,
                AVG(rendement_annee_n1) as moy_n1,
                AVG(rendement_annee_n_technologie) as moy_tech,
                AVG(rendement_annee_n_temoin) as moy_temoin,
                COUNT(*) as nb_producteurs")
            ->whereNotNull('culture_technologie')
            ->groupBy('culture_technologie');
        if (!$isAdmin) $rendementsQuery->where('user_id', $uid);
        $rendements = $rendementsQuery->orderByDesc('nb_producteurs')->limit(8)->get();

        // 4. Rendements dispositif par CEP (évolution)
        $evolutionQuery = DB::table('evolution_rendements_cep as e')
            ->leftJoin('communes as c', 'c.id', '=', 'e.commune_id')
            ->selectRaw("COALESCE(e.culture,'N/A') as culture,
                COALESCE(c.nom,'N/A') as commune,
                AVG(e.rendement_dispositif_1) as d1,
                AVG(e.rendement_dispositif_2) as d2,
                AVG(e.rendement_dispositif_3) as d3,
                AVG(e.rendement_dispositif_4) as d4")
            ->whereNotNull('e.culture')
            ->groupBy('e.culture', 'c.nom', 'c.id');
        if (!$isAdmin) $evolutionQuery->where('e.user_id', $uid);
        $evolutionRendements = $evolutionQuery->limit(8)->get();

        // 5. Sessions & visites par mois
        $sessionsQuery = DB::table('bilan_sessions_animation_cep')
            ->selectRaw("TO_CHAR(date_session, 'YYYY-MM') as mois,
                COUNT(*) as nb_sessions,
                SUM(participation_total) as participants")
            ->whereNotNull('date_session')
            ->groupBy('mois')->orderBy('mois');
        if (!$isAdmin) $sessionsQuery->where('user_id', $uid);
        $sessions = $sessionsQuery->limit(12)->get();

        $visitesQuery = DB::table('visites_echanges_commentees')
            ->selectRaw("TO_CHAR(date, 'YYYY-MM') as mois,
                COUNT(*) as nb_visites,
                SUM(visiteurs_total) as visiteurs")
            ->whereNotNull('date')
            ->groupBy('mois')->orderBy('mois');
        if (!$isAdmin) $visitesQuery->where('user_id', $uid);
        $visites = $visitesQuery->limit(12)->get();

        // Fusionner sessions + visites par mois
        $moisData = collect($sessions)->keyBy('mois')->map(fn($r) => [
            'mois'        => $r->mois,
            'nb_sessions' => (int)$r->nb_sessions,
            'participants'=> (int)($r->participants ?? 0),
            'nb_visites'  => 0,
            'visiteurs'   => 0,
        ])->all();
        foreach ($visites as $v) {
            if (isset($moisData[$v->mois])) {
                $moisData[$v->mois]['nb_visites'] = (int)$v->nb_visites;
                $moisData[$v->mois]['visiteurs']  = (int)($v->visiteurs ?? 0);
            } else {
                $moisData[$v->mois] = [
                    'mois'        => $v->mois,
                    'nb_sessions' => 0,
                    'participants'=> 0,
                    'nb_visites'  => (int)$v->nb_visites,
                    'visiteurs'   => (int)($v->visiteurs ?? 0),
                ];
            }
        }

        // 6. Avancement par module (% modules renseignés)
        $modules = [
            ['key'=>'profil_historique',                    'label'=>'Profil historique'],
            ['key'=>'hierarchisation_domaines_activites',   'label'=>"Domaines d'activités"],
            ['key'=>'hierarchisation_speculations_agricoles','label'=>'Spéculations'],
            ['key'=>'matrice_problemes',                    'label'=>'Problèmes & solutions'],
            ['key'=>'curriculum_apprentissage_cep',         'label'=>'Curriculum CEP'],
            ['key'=>'resume_protocoles_experimentations',   'label'=>'Protocoles expér.'],
            ['key'=>'liste_presence_sensibilisation',       'label'=>'Liste présence'],
            ['key'=>'identification_participants_cep',      'label'=>'Participants CEP'],
            ['key'=>'cep',                                  'label'=>'CEP créés'],
            ['key'=>'animation_sessions_cep',               'label'=>'Sessions anim.'],
            ['key'=>'bilan_sessions_animation_cep',         'label'=>'Bilans sessions'],
            ['key'=>'organisation_visites_echanges',        'label'=>'Org. visites'],
            ['key'=>'visites_echanges_commentees',          'label'=>'Visites commentées'],
            ['key'=>'evolution_rendements_cep',             'label'=>'Rendements CEP'],
            ['key'=>'rendement_dispositif',                 'label'=>'Rendement disp.'],
            ['key'=>'rapport_demarrage_cep',                'label'=>'Rapport démarrage'],
        ];
        $avancement = array_map(function($m) use ($uid, $isAdmin) {
            $count = DB::table($m['key'])
                ->when(!$isAdmin, fn($q) => $q->where('user_id', $uid))
                ->count();
            return ['label' => $m['label'], 'valeur' => $count, 'renseigne' => $count > 0];
        }, $modules);

        // 7. Top spéculations
        $topSpecQuery = DB::table('identification_participants_cep')
            ->when(!$isAdmin, fn($q) => $q->where('user_id', $uid))
            ->whereNotNull('speculation')->where('speculation', '!=', '')
            ->selectRaw('speculation, COUNT(*) as nb')
            ->groupBy('speculation')->orderByDesc('nb')->limit(6);
        $topSpeculations = $topSpecQuery->get();

        // 8. Catégories d'âge
        $categoriesAge = DB::table('identification_participants_cep')
            ->when(!$isAdmin, fn($q) => $q->where('user_id', $uid))
            ->whereNotNull('categorie_age')
            ->selectRaw('categorie_age, COUNT(*) as nb')
            ->groupBy('categorie_age')->get();

        // 9. Top pratiques agroécologiques
        $pratiquesMap = [];
        foreach (['pratique_agroecologique_1','pratique_agroecologique_2','pratique_agroecologique_3'] as $col) {
            DB::table('base_beneficiaires_intervention')
                ->when(!$isAdmin, fn($q) => $q->where('user_id', $uid))
                ->whereNotNull($col)->where($col, '!=', '')
                ->selectRaw("$col as pratique, COUNT(*) as nb")
                ->groupBy($col)->get()
                ->each(fn($r) => $pratiquesMap[$r->pratique] = ($pratiquesMap[$r->pratique] ?? 0) + $r->nb);
        }
        arsort($pratiquesMap);
        $topPratiques = collect(array_slice($pratiquesMap, 0, 6, true))
            ->map(fn($nb, $p) => ['pratique' => $p, 'nb' => $nb])->values();

        // 10. Type producteur
        $typesProducteur = DB::table('base_beneficiaires_intervention')
            ->when(!$isAdmin, fn($q) => $q->where('user_id', $uid))
            ->whereNotNull('type_producteur')
            ->selectRaw('type_producteur, COUNT(*) as nb')
            ->groupBy('type_producteur')->get();

        // 11. Top difficultés signalées
        $topDifficultes = DB::table('difficultes_suggestions')
            ->when(!$isAdmin, fn($q) => $q->where('user_id', $uid))
            ->whereNotNull('difficulte')->where('difficulte', '!=', '')
            ->selectRaw('difficulte, COUNT(*) as nb')
            ->groupBy('difficulte')->orderByDesc('nb')->limit(5)->get();

        // 12. Pipeline problèmes → solutions (admin)
        $pipeline = null;
        $gainRendement = collect();
        if ($isAdmin) {
            $pipeline = [
                'total'      => DB::table('matrice_problemes')->count(),
                'pertinents' => DB::table('matrice_problemes')->where('est_pertinent', true)->count(),
                'curriculum' => DB::table('curriculum_apprentissage_cep')->distinct('matrice_probleme_id')->count('matrice_probleme_id'),
                'protocoles' => DB::table('resume_protocoles_experimentations')->count(),
            ];
            $gainRendement = DB::table('rendement_dispositif')
                ->whereNotNull('rendement_annee_n_technologie')
                ->whereNotNull('rendement_annee_n_temoin')
                ->where('rendement_annee_n_temoin', '>', 0)
                ->whereNotNull('culture_technologie')
                ->selectRaw("culture_technologie as culture,
                    ROUND(AVG((rendement_annee_n_technologie - rendement_annee_n_temoin) / rendement_annee_n_temoin * 100)::numeric, 1) as gain_pct,
                    COUNT(*) as nb_producteurs")
                ->groupBy('culture_technologie')->orderByDesc('gain_pct')->limit(6)->get();
        }

        return response()->json([
            'participants'        => $participants,
            'repartition_hf'      => $repartitionHF,
            'rendements'          => $rendements,
            'evolution_rendements'=> $evolutionRendements,
            'sessions_visites'    => collect($moisData)->sortKeys()->values(),
            'avancement'          => $avancement,
            'top_speculations'    => $topSpeculations,
            'categories_age'      => $categoriesAge,
            'top_pratiques'       => $topPratiques,
            'types_producteur'    => $typesProducteur,
            'top_difficultes'     => $topDifficultes,
            'pipeline'            => $pipeline,
            'gain_rendement'      => $gainRendement,
        ]);
    });

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
});

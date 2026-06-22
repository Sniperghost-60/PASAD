<?php

use App\Models\Departement;
use App\Models\Commune;
use App\Models\Arrondissement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

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
            return \App\Models\User::with('roles')->get()->map(fn ($u) => [
                ...$u->toArray(),
                'roles' => $u->getRoleNames(),
            ]);
        });

        Route::post('/users/{user}/roles', function (Request $request, \App\Models\User $user) {
            $request->validate(['role' => 'required|string|exists:roles,name']);
            $user->syncRoles([$request->role]);
            return response()->json(['success' => true, 'roles' => $user->getRoleNames()]);
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

    // ── Création d'utilisateurs (admin+) ─────────────────────────────────
    Route::middleware('role:Administrateur|Superviseur|Super-Admin')->group(function () {
        Route::post('/users', function (Request $request) {
            $validated = $request->validate([
                'name'       => 'required|string|max:255',
                'email'      => 'required|email|unique:users,email',
                'password'   => ['required', Password::min(8)],
                'role'       => 'required|string|exists:roles,name',
                'commune_ids' => 'sometimes|array',
                'commune_ids.*' => 'exists:communes,id',
            ]);

            $user = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            $user->assignRole($validated['role']);

            // Si c'est un conseiller, affecter les communes
            if ($validated['role'] === 'Conseiller' && !empty($validated['commune_ids'])) {
                $user->communes()->sync($validated['commune_ids']);
            }

            return response()->json([
                'success' => true,
                'user'    => [
                    ...$user->toArray(),
                    'roles'   => $user->getRoleNames(),
                    'communes' => $user->communes,
                ],
            ], 201);
        });
    });
});

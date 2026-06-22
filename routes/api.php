<?php

use App\Models\Departement;
use App\Models\Commune;
use App\Models\Arrondissement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
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
                'password'          => ['required', Password::min(8)],
                'role'              => 'required|string|exists:roles,name',
                'commune_ids'       => 'sometimes|array',
                'commune_ids.*'     => 'exists:communes,id',
                'arrondissement_ids'    => 'sometimes|array',
                'arrondissement_ids.*'  => 'exists:arrondissements,id',
            ]);

            $user = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
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
    });
});

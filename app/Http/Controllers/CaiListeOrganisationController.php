<?php

namespace App\Http\Controllers;

use App\Models\CaiListeOrganisation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CaiListeOrganisationController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiListeOrganisation::where('user_id', $request->user()->id)
            ->when($request->filled('commune_id'), fn ($q) => $q->where('commune_id', $request->integer('commune_id')));

        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'organisations'                              => ['required', 'array', 'min:1'],
            'organisations.*.commune_id'                  => ['nullable', 'integer', 'exists:communes,id'],
            'organisations.*.nom_op'                      => ['required', 'string', 'max:255'],
            'organisations.*.siege_contact'                => ['nullable', 'string', 'max:255'],
            'organisations.*.numero_groupement'            => ['nullable', 'string', 'max:100'],
            'organisations.*.effectif_h'                   => ['nullable', 'integer', 'min:0'],
            'organisations.*.effectif_f'                   => ['nullable', 'integer', 'min:0'],
            'organisations.*.produits_agricoles'           => ['nullable', 'array'],
            'organisations.*.produits_agricoles.*.type_produit' => ['nullable', 'string', 'max:255'],
            'organisations.*.produits_agricoles.*.quantite'     => ['nullable', 'string', 'max:100'],
            'organisations.*.mode_commercialisation'       => ['nullable', 'string', 'max:255'],
            'organisations.*.marche_actuel'                => ['nullable', 'string', 'max:255'],
            'organisations.*.attente'                      => ['nullable', 'array'],
            'organisations.*.attente.*'                    => ['string', 'max:500'],
        ]);

        $userId = $request->user()->id;

        $saved = DB::transaction(fn () =>
            collect($validated['organisations'])->map(fn ($o) =>
                CaiListeOrganisation::create([
                    'user_id'                => $userId,
                    'commune_id'             => $o['commune_id']             ?? null,
                    'nom_op'                 => $o['nom_op'],
                    'siege_contact'          => $o['siege_contact']          ?? null,
                    'numero_groupement'      => $o['numero_groupement']      ?? null,
                    'effectif_h'             => $o['effectif_h']             ?? null,
                    'effectif_f'             => $o['effectif_f']             ?? null,
                    'produits_agricoles'     => $o['produits_agricoles']     ?? null,
                    'mode_commercialisation' => $o['mode_commercialisation'] ?? null,
                    'marche_actuel'          => $o['marche_actuel']          ?? null,
                    'attente'                => $o['attente']                ?? [],
                ])
            )->all()
        );

        return response()->json([
            'message' => 'Liste des organisations enregistrée avec succès !',
            'data'    => $saved,
        ], 201);
    }

    public function update(Request $request, CaiListeOrganisation $organisation)
    {
        abort_unless($organisation->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'nom_op'                             => ['required', 'string', 'max:255'],
            'siege_contact'                      => ['nullable', 'string', 'max:255'],
            'numero_groupement'                  => ['nullable', 'string', 'max:100'],
            'effectif_h'                         => ['nullable', 'integer', 'min:0'],
            'effectif_f'                         => ['nullable', 'integer', 'min:0'],
            'produits_agricoles'                 => ['nullable', 'array'],
            'produits_agricoles.*.type_produit'  => ['nullable', 'string', 'max:255'],
            'produits_agricoles.*.quantite'      => ['nullable', 'string', 'max:100'],
            'mode_commercialisation'             => ['nullable', 'string', 'max:255'],
            'marche_actuel'                      => ['nullable', 'string', 'max:255'],
            'attente'                            => ['nullable', 'array'],
            'attente.*'                          => ['string', 'max:500'],
        ]);

        $organisation->update([
            'nom_op'                 => $validated['nom_op'],
            'siege_contact'          => $validated['siege_contact']          ?? null,
            'numero_groupement'      => $validated['numero_groupement']      ?? null,
            'effectif_h'             => $validated['effectif_h']             ?? null,
            'effectif_f'             => $validated['effectif_f']             ?? null,
            'produits_agricoles'     => $validated['produits_agricoles']     ?? [],
            'mode_commercialisation' => $validated['mode_commercialisation'] ?? null,
            'marche_actuel'          => $validated['marche_actuel']          ?? null,
            'attente'                => $validated['attente']                ?? [],
        ]);

        return response()->json([
            'message' => 'Organisation mise à jour avec succès !',
            'data'    => $organisation,
        ]);
    }
}

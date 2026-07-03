<?php

namespace App\Http\Controllers;

use App\Models\CaiListeProducteur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CaiListeProducteurController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiListeProducteur::with('commune')
            ->where('user_id', $request->user()->id)
            ->when($request->filled('commune_id'), fn ($q) => $q->where('commune_id', $request->integer('commune_id')));

        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'producteurs'                          => ['required', 'array', 'min:1'],
            'producteurs.*.commune_id'             => ['nullable', 'integer', 'exists:communes,id'],
            'producteurs.*.nom_prenom'             => ['required', 'string', 'max:255'],
            'producteurs.*.sexe'                   => ['required', 'in:M,F'],
            'producteurs.*.age'                    => ['nullable', 'integer', 'min:1', 'max:120'],
            'producteurs.*.village'                => ['nullable', 'string', 'max:255'],
            'producteurs.*.contact'                => ['nullable', 'string', 'max:50'],
            'producteurs.*.op_appartenance'        => ['nullable', 'string', 'max:255'],
            'producteurs.*.produits_agricoles'     => ['nullable', 'array'],
            'producteurs.*.produits_agricoles.*.type_produit' => ['nullable', 'string', 'max:255'],
            'producteurs.*.produits_agricoles.*.quantite'     => ['nullable', 'string', 'max:100'],
            'producteurs.*.mode_commercialisation' => ['nullable', 'string', 'max:255'],
            'producteurs.*.marche_actuel'          => ['nullable', 'string', 'max:255'],
            'producteurs.*.attentes'               => ['nullable', 'array'],
            'producteurs.*.attentes.*'             => ['string', 'max:500'],
        ]);

        $userId = $request->user()->id;

        $saved = DB::transaction(fn () =>
            collect($validated['producteurs'])->map(fn ($p) =>
                CaiListeProducteur::create([
                    'user_id'               => $userId,
                    'commune_id'            => $p['commune_id']            ?? null,
                    'nom_prenom'            => $p['nom_prenom'],
                    'sexe'                  => $p['sexe'],
                    'age'                   => $p['age']                   ?? null,
                    'village'               => $p['village']               ?? null,
                    'contact'               => $p['contact']               ?? null,
                    'op_appartenance'       => $p['op_appartenance']       ?? null,
                    'produits_agricoles'    => $p['produits_agricoles']    ?? null,
                    'mode_commercialisation'=> $p['mode_commercialisation'] ?? null,
                    'marche_actuel'         => $p['marche_actuel']         ?? null,
                    'attentes'              => $p['attentes']              ?? [],
                ])
            )->all()
        );

        return response()->json([
            'message' => 'Liste CAI enregistrée avec succès !',
            'data'    => $saved,
        ], 201);
    }

    public function update(Request $request, CaiListeProducteur $producteur)
    {
        abort_unless($producteur->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'nom_prenom'                          => ['required', 'string', 'max:255'],
            'sexe'                                 => ['required', 'in:M,F'],
            'age'                                  => ['nullable', 'integer', 'min:1', 'max:120'],
            'village'                              => ['nullable', 'string', 'max:255'],
            'contact'                              => ['nullable', 'string', 'max:50'],
            'op_appartenance'                      => ['nullable', 'string', 'max:255'],
            'produits_agricoles'                   => ['nullable', 'array'],
            'produits_agricoles.*.type_produit'    => ['nullable', 'string', 'max:255'],
            'produits_agricoles.*.quantite'        => ['nullable', 'string', 'max:100'],
            'mode_commercialisation'               => ['nullable', 'string', 'max:255'],
            'marche_actuel'                        => ['nullable', 'string', 'max:255'],
            'attentes'                             => ['nullable', 'array'],
            'attentes.*'                           => ['string', 'max:500'],
        ]);

        $producteur->update([
            'nom_prenom'             => $validated['nom_prenom'],
            'sexe'                   => $validated['sexe'],
            'age'                    => $validated['age']                    ?? null,
            'village'                => $validated['village']                ?? null,
            'contact'                => $validated['contact']                ?? null,
            'op_appartenance'        => $validated['op_appartenance']        ?? null,
            'produits_agricoles'     => $validated['produits_agricoles']     ?? [],
            'mode_commercialisation' => $validated['mode_commercialisation'] ?? null,
            'marche_actuel'          => $validated['marche_actuel']          ?? null,
            'attentes'               => $validated['attentes']               ?? [],
        ]);

        return response()->json([
            'message' => 'Producteur mis à jour avec succès !',
            'data'    => $producteur,
        ]);
    }
}

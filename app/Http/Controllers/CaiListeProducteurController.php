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
            ->when($request->filled('commune_id'), fn ($q) => $q->where('commune_id', $request->integer('commune_id')))
            ->when($request->filled('date_session'), fn ($q) => $q->whereDate('date_session', $request->input('date_session')));

        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date_session'                         => ['nullable', 'date'],
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
            'producteurs.*.attentes'               => ['nullable', 'string'],
        ]);

        $userId      = $request->user()->id;
        $dateSession = $validated['date_session'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $dateSession) {
            $q = CaiListeProducteur::where('user_id', $userId);
            $dateSession
                ? $q->whereDate('date_session', $dateSession)
                : $q->whereNull('date_session');
            $q->delete();

            return collect($validated['producteurs'])->map(fn ($p) =>
                CaiListeProducteur::create([
                    'user_id'               => $userId,
                    'commune_id'            => $p['commune_id']            ?? null,
                    'date_session'          => $dateSession,
                    'nom_prenom'            => $p['nom_prenom'],
                    'sexe'                  => $p['sexe'],
                    'age'                   => $p['age']                   ?? null,
                    'village'               => $p['village']               ?? null,
                    'contact'               => $p['contact']               ?? null,
                    'op_appartenance'       => $p['op_appartenance']       ?? null,
                    'produits_agricoles'    => $p['produits_agricoles']    ?? null,
                    'mode_commercialisation'=> $p['mode_commercialisation'] ?? null,
                    'marche_actuel'         => $p['marche_actuel']         ?? null,
                    'attentes'              => $p['attentes']              ?? null,
                ])
            )->all();
        });

        return response()->json([
            'message' => 'Liste CAI enregistrée avec succès !',
            'data'    => $saved,
        ], 201);
    }
}

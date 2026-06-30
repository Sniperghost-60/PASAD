<?php

namespace App\Http\Controllers;

use App\Models\CaiListeOrganisation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CaiListeOrganisationController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiListeOrganisation::where('user_id', $request->user()->id);

        if ($request->filled('commune_id')) {
            $query->where('commune_id', $request->commune_id);
        }
        if ($request->filled('date_session')) {
            $query->where('date_session', $request->date_session);
        }

        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'date_session'  => 'nullable|date',
            'commune_id'    => 'nullable|exists:communes,id',
            'organisations' => 'required|array|min:1',
            'organisations.*.nom_op'                => 'required|string|max:255',
            'organisations.*.siege_contact'         => 'nullable|string|max:255',
            'organisations.*.numero_groupement'     => 'nullable|string|max:100',
            'organisations.*.effectif_h'            => 'nullable|integer|min:0',
            'organisations.*.effectif_f'            => 'nullable|integer|min:0',
            'organisations.*.produits_agricoles'    => 'nullable|array',
            'organisations.*.mode_commercialisation'=> 'nullable|string|max:255',
            'organisations.*.marche_actuel'         => 'nullable|string|max:255',
            'organisations.*.attente'               => 'nullable|string',
        ]);

        $userId    = $request->user()->id;
        $communeId = $request->input('commune_id');
        $date      = $request->input('date_session');

        DB::transaction(function () use ($request, $userId, $communeId, $date) {
            CaiListeOrganisation::where('user_id', $userId)
                ->where('commune_id', $communeId)
                ->where('date_session', $date)
                ->delete();

            foreach ($request->organisations as $org) {
                CaiListeOrganisation::create([
                    'user_id'                => $userId,
                    'commune_id'             => $communeId,
                    'date_session'           => $date,
                    'nom_op'                 => $org['nom_op'],
                    'siege_contact'          => $org['siege_contact']          ?? null,
                    'numero_groupement'      => $org['numero_groupement']      ?? null,
                    'effectif_h'             => $org['effectif_h']             ?? null,
                    'effectif_f'             => $org['effectif_f']             ?? null,
                    'produits_agricoles'     => $org['produits_agricoles']     ?? null,
                    'mode_commercialisation' => $org['mode_commercialisation'] ?? null,
                    'marche_actuel'          => $org['marche_actuel']          ?? null,
                    'attente'                => $org['attente']                ?? null,
                ]);
            }
        });

        return response()->json(['message' => 'Enregistré avec succès'], 201);
    }
}

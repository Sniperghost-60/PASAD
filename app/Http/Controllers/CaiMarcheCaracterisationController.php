<?php

namespace App\Http\Controllers;

use App\Models\CaiMarcheCaracterisation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CaiMarcheCaracterisationController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiMarcheCaracterisation::where('user_id', $request->user()->id);

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
            'date_session'              => 'nullable|date',
            'commune_id'                => 'nullable|exists:communes,id',
            'marches'                   => 'required|array|min:1',
            'marches.*.nom_marche'      => 'required|string|max:255',
            'marches.*.distance'        => 'nullable|string|max:100',
            'marches.*.type_marche'     => 'nullable|string|max:255',
            'marches.*.localisation'    => 'nullable|string|max:255',
            'marches.*.frequence_animation' => 'nullable|string|max:255',
            'marches.*.etat_route'      => 'nullable|string|max:255',
            'marches.*.facilite_transport'  => 'nullable|string|max:255',
            'marches.*.cout_transport'  => 'nullable|string|max:100',
            'marches.*.securite'        => 'nullable|string|max:255',
            'marches.*.produits'        => 'nullable|array',
        ]);

        $userId    = $request->user()->id;
        $communeId = $request->input('commune_id');
        $date      = $request->input('date_session');

        DB::transaction(function () use ($request, $userId, $communeId, $date) {
            CaiMarcheCaracterisation::where('user_id', $userId)
                ->where('commune_id', $communeId)
                ->where('date_session', $date)
                ->delete();

            foreach ($request->marches as $m) {
                CaiMarcheCaracterisation::create([
                    'user_id'              => $userId,
                    'commune_id'           => $communeId,
                    'date_session'         => $date,
                    'nom_marche'           => $m['nom_marche'],
                    'distance'             => $m['distance']             ?? null,
                    'type_marche'          => $m['type_marche']          ?? null,
                    'localisation'         => $m['localisation']         ?? null,
                    'frequence_animation'  => $m['frequence_animation']  ?? null,
                    'etat_route'           => $m['etat_route']           ?? null,
                    'facilite_transport'   => $m['facilite_transport']   ?? null,
                    'cout_transport'       => $m['cout_transport']       ?? null,
                    'securite'             => $m['securite']             ?? null,
                    'produits'             => $m['produits']             ?? null,
                ]);
            }
        });

        return response()->json(['message' => 'Enregistré avec succès'], 201);
    }
}

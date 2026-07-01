<?php

namespace App\Http\Controllers;

use App\Models\CaiEtudeMarche;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CaiEtudeMarcheController extends Controller
{
    public function index(Request $request)
    {
        $communeId   = $request->query('commune_id');
        $dateSession = $request->query('date_session');

        $rows = CaiEtudeMarche::where('user_id', Auth::id())
            ->when($communeId,   fn($q) => $q->where('commune_id',   $communeId))
            ->when($dateSession, fn($q) => $q->where('date_session', $dateSession))
            ->get();

        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $communeId   = $request->input('commune_id');
        $dateSession = $request->input('date_session');
        $rows        = $request->input('rows', []);

        foreach ($rows as $row) {
            CaiEtudeMarche::updateOrCreate(
                [
                    'user_id'      => Auth::id(),
                    'commune_id'   => $communeId,
                    'date_session' => $dateSession,
                    'parametre'    => $row['parametre'],
                ],
                [
                    'categorie'              => $row['categorie'],
                    'tendances_marches'      => $row['tendances_marches']      ?? null,
                    'situation_exploitation' => $row['situation_exploitation'] ?? null,
                    'ecarts_combler'         => $row['ecarts_combler']         ?? null,
                ]
            );
        }

        return response()->json(['message' => 'Fiche enregistrée'], 201);
    }
}

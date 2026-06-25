<?php

namespace App\Http\Controllers;

use App\Models\ListePresenceSensibilisation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ListePresenceSensibilisationController extends Controller
{
    public function index(Request $request)
    {
        $query = ListePresenceSensibilisation::with([
            'departement', 'commune', 'arrondissement', 'user',
        ])->where('user_id', $request->user()->id);

        if ($request->filled('date_session')) {
            $query->whereDate('date_session', $request->input('date_session'));
        }

        $query->when(
            $request->filled('commune_id'),
            fn ($q) => $q->where('commune_id', $request->integer('commune_id'))
        );

        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date_session'                       => ['nullable', 'date'],
            'participants'                       => ['required', 'array', 'min:1'],
            'participants.*.departement_id'      => ['nullable', 'integer', 'exists:departements,id'],
            'participants.*.commune_id'          => ['nullable', 'integer', 'exists:communes,id'],
            'participants.*.arrondissement_id'   => ['nullable', 'integer', 'exists:arrondissements,id'],
            'participants.*.village'             => ['nullable', 'string', 'max:255'],
            'participants.*.nom_producteur'      => ['required', 'string', 'max:255'],
            'participants.*.prenoms_producteur'  => ['nullable', 'string', 'max:255'],
            'participants.*.contact1_producteur' => ['nullable', 'string', 'max:50'],
            'participants.*.contact2_producteur' => ['nullable', 'string', 'max:50'],
            'participants.*.sexe'                => ['required', 'in:M,F'],
        ]);

        $userId      = $request->user()->id;
        $dateSession = $validated['date_session'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $dateSession) {
            // Remplace les lignes de la même session (même date + même user)
            $query = ListePresenceSensibilisation::where('user_id', $userId);
            if ($dateSession) {
                $query->whereDate('date_session', $dateSession);
            } else {
                $query->whereNull('date_session');
            }
            $query->delete();

            return collect($validated['participants'])->map(fn ($p) =>
                ListePresenceSensibilisation::create([
                    'user_id'               => $userId,
                    'date_session'          => $dateSession,
                    'departement_id'        => $p['departement_id'] ?? null,
                    'commune_id'            => $p['commune_id'] ?? null,
                    'arrondissement_id'     => $p['arrondissement_id'] ?? null,
                    'village'               => $p['village'] ?? null,
                    'nom_producteur'        => $p['nom_producteur'],
                    'prenoms_producteur'    => $p['prenoms_producteur'] ?? null,
                    'contact1_producteur'   => $p['contact1_producteur'] ?? null,
                    'contact2_producteur'   => $p['contact2_producteur'] ?? null,
                    'sexe'                  => $p['sexe'],
                ])
            )->all();
        });

        return response()->json([
            'message' => 'Liste de présence enregistrée avec succès !',
            'data'    => $saved,
        ], 201);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\IdentificationParticipantCep;
use App\Models\ListePresenceSensibilisation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IdentificationParticipantCepController extends Controller
{
    public function index(Request $request)
    {
        $query = IdentificationParticipantCep::with(['departement', 'commune', 'arrondissement', 'user'])
            ->where('user_id', $request->user()->id);

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
            'date_session'                            => ['nullable', 'date'],
            'participants'                            => ['required', 'array', 'min:1'],
            'participants.*.departement_id'           => ['nullable', 'integer', 'exists:departements,id'],
            'participants.*.commune_id'               => ['nullable', 'integer', 'exists:communes,id'],
            'participants.*.arrondissement_id'        => ['nullable', 'integer', 'exists:arrondissements,id'],
            'participants.*.village'                  => ['nullable', 'string', 'max:255'],
            'participants.*.nom_producteur'           => ['required', 'string', 'max:255'],
            'participants.*.prenoms_producteur'       => ['nullable', 'string', 'max:255'],
            'participants.*.contact1_producteur'      => ['nullable', 'string', 'max:50'],
            'participants.*.contact2_producteur'      => ['nullable', 'string', 'max:50'],
            'participants.*.sexe'                     => ['required', 'in:M,F'],
            'participants.*.annee_naissance'          => ['nullable', 'integer', 'min:1900', 'max:' . date('Y')],
            'participants.*.categorie_age'            => ['nullable', 'in:J,A,V'],
            'participants.*.speculation'              => ['nullable', 'string', 'max:255'],
            'participants.*.responsabilite_fonction'  => ['nullable', 'string', 'max:255'],
        ]);

        $userId      = $request->user()->id;
        $dateSession = $validated['date_session'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $dateSession) {
            $q = IdentificationParticipantCep::where('user_id', $userId);
            $dateSession
                ? $q->whereDate('date_session', $dateSession)
                : $q->whereNull('date_session');
            $q->delete();

            return collect($validated['participants'])->map(fn ($p) =>
                IdentificationParticipantCep::create([
                    'user_id'                => $userId,
                    'date_session'           => $dateSession,
                    'departement_id'         => $p['departement_id']        ?? null,
                    'commune_id'             => $p['commune_id']            ?? null,
                    'arrondissement_id'      => $p['arrondissement_id']     ?? null,
                    'village'                => $p['village']               ?? null,
                    'nom_producteur'         => $p['nom_producteur'],
                    'prenoms_producteur'     => $p['prenoms_producteur']    ?? null,
                    'contact1_producteur'    => $p['contact1_producteur']   ?? null,
                    'contact2_producteur'    => $p['contact2_producteur']   ?? null,
                    'sexe'                   => $p['sexe'],
                    'annee_naissance'        => $p['annee_naissance']       ?? null,
                    'categorie_age'          => $p['categorie_age']         ?? null,
                    'speculation'            => $p['speculation']           ?? null,
                    'responsabilite_fonction'=> $p['responsabilite_fonction'] ?? null,
                ])
            )->all();
        });

        return response()->json([
            'message' => 'Participants CEP enregistrés avec succès !',
            'data'    => $saved,
        ], 201);
    }

    /* Retourne les participants d'une session de sensibilisation pour import */
    public function fromSensibilisation(Request $request)
    {
        $request->validate(['date_session' => ['nullable', 'date']]);

        $query = ListePresenceSensibilisation::with(['departement', 'commune', 'arrondissement'])
            ->where('user_id', $request->user()->id);

        if ($request->filled('date_session')) {
            $query->whereDate('date_session', $request->input('date_session'));
        }

        return response()->json($query->orderBy('id')->get());
    }
}

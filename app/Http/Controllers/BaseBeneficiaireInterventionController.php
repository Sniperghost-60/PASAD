<?php

namespace App\Http\Controllers;

use App\Models\BaseBeneficiaireIntervention;
use App\Models\CepMembre;
use App\Models\IdentificationParticipantCep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BaseBeneficiaireInterventionController extends Controller
{
    const TYPES_PRODUCTEUR = [
        'Formé en 2025',
        'Formé en 2026',
        'Relais Expérimenté 2025',
        'Relais simple',
        'Apprenant',
    ];

    /* ── Participants disponibles depuis Identification CEP + coords CEP ─ */
    public function participantsDisponibles(Request $request)
    {
        $participants = IdentificationParticipantCep::with([
            'departement', 'commune', 'arrondissement',
        ])
        ->where('user_id', $request->user()->id)
        ->orderBy('nom_producteur')
        ->get()
        ->map(function ($p) {
            // Cherche le CEP auquel appartient ce participant
            $membre = CepMembre::with('cep')
                ->where('identification_participant_cep_id', $p->id)
                ->first();

            return [
                'id'                      => $p->id,
                'departement_id'          => $p->departement_id,
                'commune_id'              => $p->commune_id,
                'arrondissement_id'       => $p->arrondissement_id,
                'village'                 => $p->village,
                'nom_producteur'          => $p->nom_producteur,
                'prenoms_producteur'      => $p->prenoms_producteur,
                'contact1_producteur'     => $p->contact1_producteur,
                'contact2_producteur'     => $p->contact2_producteur,
                'sexe'                    => $p->sexe,
                'annee_naissance'         => $p->annee_naissance,
                'responsabilite_fonction' => $p->responsabilite_fonction,
                'departement'             => $p->departement,
                'commune'                 => $p->commune,
                'arrondissement'          => $p->arrondissement,
                // Coordonnées du CEP (auto-remplies pour les participants identifiés)
                'cep_nom'                 => $membre?->cep?->nom_cep,
                'cep_coordonnee_x'        => $membre?->cep?->longitude,
                'cep_coordonnee_y'        => $membre?->cep?->latitude,
            ];
        });

        return response()->json($participants);
    }

    /* ── Liste ────────────────────────────────────────────────────────── */
    public function index(Request $request)
    {
        $query = BaseBeneficiaireIntervention::with(['departement', 'commune', 'arrondissement'])
            ->where('user_id', $request->user()->id);

        if ($request->filled('cep_id')) {
            $cepId = $request->input('cep_id');
            $query->where(function ($q) use ($cepId) {
                $q->where('cep_id', $cepId)->orWhereNull('cep_id');
            });
        }
        if ($request->filled('commune_id')) {
            $query->where('commune_id', $request->integer('commune_id'));
        }
        if ($request->filled('date_session')) {
            $query->whereDate('date_session', $request->input('date_session'));
        }

        return response()->json($query->orderBy('id')->get());
    }

    /* ── Enregistrer ──────────────────────────────────────────────────── */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cep_id'                                    => ['nullable', 'integer', 'exists:cep,id'],
            'date_session'                              => ['nullable', 'date'],
            'beneficiaires'                             => ['required', 'array', 'min:1'],
            'beneficiaires.*.identification_participant_cep_id' => ['nullable', 'integer', 'exists:identification_participants_cep,id'],
            'beneficiaires.*.departement_id'            => ['nullable', 'integer', 'exists:departements,id'],
            'beneficiaires.*.commune_id'                => ['nullable', 'integer', 'exists:communes,id'],
            'beneficiaires.*.arrondissement_id'         => ['nullable', 'integer', 'exists:arrondissements,id'],
            'beneficiaires.*.village'                   => ['nullable', 'string', 'max:255'],
            'beneficiaires.*.nom_producteur'            => ['required', 'string', 'max:255'],
            'beneficiaires.*.prenoms_producteur'        => ['nullable', 'string', 'max:255'],
            'beneficiaires.*.contact1_producteur'       => ['nullable', 'string', 'max:50'],
            'beneficiaires.*.contact2_producteur'       => ['nullable', 'string', 'max:50'],
            'beneficiaires.*.sexe'                      => ['required', 'in:M,F'],
            'beneficiaires.*.annee_naissance'           => ['nullable', 'integer', 'min:1900', 'max:' . date('Y')],
            'beneficiaires.*.type_producteur'           => ['nullable', 'string', 'in:' . implode(',', self::TYPES_PRODUCTEUR)],
            'beneficiaires.*.type_parcelle'             => ['nullable', 'string', 'max:255'],
            'beneficiaires.*.superficie_totale'         => ['nullable', 'numeric', 'min:0'],
            'beneficiaires.*.pratique_agroecologique_1' => ['nullable', 'string', 'max:255'],
            'beneficiaires.*.pratique_agroecologique_2' => ['nullable', 'string', 'max:255'],
            'beneficiaires.*.pratique_agroecologique_3' => ['nullable', 'string', 'max:255'],
            'beneficiaires.*.coordonnee_x'              => ['nullable', 'numeric'],
            'beneficiaires.*.coordonnee_y'              => ['nullable', 'numeric'],
            'beneficiaires.*.culture_principale'        => ['nullable', 'string', 'max:255'],
            'beneficiaires.*.culture_associee'          => ['nullable', 'string', 'max:255'],
        ]);

        $userId      = $request->user()->id;
        $cepId       = $validated['cep_id'] ?? null;
        $dateSession = $validated['date_session'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $cepId, $dateSession) {
            $q = BaseBeneficiaireIntervention::where('user_id', $userId);
            $cepId ? $q->where('cep_id', $cepId) : $q->whereNull('cep_id');
            $dateSession ? $q->whereDate('date_session', $dateSession) : $q->whereNull('date_session');
            $q->delete();

            return collect($validated['beneficiaires'])->map(fn ($b) =>
                BaseBeneficiaireIntervention::create([
                    'user_id'                           => $userId,
                    'cep_id'                            => $cepId,
                    'date_session'                      => $dateSession,
                    'identification_participant_cep_id' => $b['identification_participant_cep_id'] ?? null,
                    'departement_id'                    => $b['departement_id']    ?? null,
                    'commune_id'                        => $b['commune_id']        ?? null,
                    'arrondissement_id'                 => $b['arrondissement_id'] ?? null,
                    'village'                           => $b['village']           ?? null,
                    'nom_producteur'                    => $b['nom_producteur'],
                    'prenoms_producteur'                => $b['prenoms_producteur']        ?? null,
                    'contact1_producteur'               => $b['contact1_producteur']       ?? null,
                    'contact2_producteur'               => $b['contact2_producteur']       ?? null,
                    'sexe'                              => $b['sexe'],
                    'annee_naissance'                   => $b['annee_naissance']           ?? null,
                    'type_producteur'                   => $b['type_producteur']           ?? null,
                    'type_parcelle'                     => $b['type_parcelle']             ?? null,
                    'superficie_totale'                 => $b['superficie_totale']         ?? null,
                    'pratique_agroecologique_1'         => $b['pratique_agroecologique_1'] ?? null,
                    'pratique_agroecologique_2'         => $b['pratique_agroecologique_2'] ?? null,
                    'pratique_agroecologique_3'         => $b['pratique_agroecologique_3'] ?? null,
                    'coordonnee_x'                      => $b['coordonnee_x']              ?? null,
                    'coordonnee_y'                      => $b['coordonnee_y']              ?? null,
                    'culture_principale'                => $b['culture_principale']        ?? null,
                    'culture_associee'                  => $b['culture_associee']          ?? null,
                ])
            )->all();
        });

        return response()->json([
            'message' => count($saved) . ' bénéficiaire(s) enregistré(s) avec succès !',
            'data'    => $saved,
        ], 201);
    }
}

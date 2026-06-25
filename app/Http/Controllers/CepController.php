<?php

namespace App\Http\Controllers;

use App\Models\Cep;
use App\Models\CepMembre;
use App\Models\IdentificationParticipantCep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CepController extends Controller
{
    /* ── Liste des CEP du conseiller ──────────────────────────────────── */
    public function index(Request $request)
    {
        $ceps = Cep::with([
            'departement', 'commune', 'arrondissement',
            'membres.participant.departement',
            'membres.participant.commune',
            'membres.participant.arrondissement',
        ])
        ->where('user_id', $request->user()->id)
        ->when($request->filled('commune_id'), fn($q) => $q->where('commune_id', $request->integer('commune_id')))
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($ceps);
    }

    /* ── Créer un CEP ─────────────────────────────────────────────────── */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_cep'          => ['required', 'string', 'max:255'],
            'adresse'          => ['nullable', 'string', 'max:255'],
            'departement_id'   => ['nullable', 'integer', 'exists:departements,id'],
            'commune_id'       => ['nullable', 'integer', 'exists:communes,id'],
            'arrondissement_id'=> ['nullable', 'integer', 'exists:arrondissements,id'],
            'village'          => ['nullable', 'string', 'max:255'],
            'latitude'         => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'        => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $userId    = $request->user()->id;
        $communeId = $validated['commune_id'] ?? null;

        // Règle : max 2 CEP par commune par conseiller
        if ($communeId) {
            $count = Cep::where('user_id', $userId)
                        ->where('commune_id', $communeId)
                        ->count();

            if ($count >= 2) {
                return response()->json([
                    'message' => 'Vous avez déjà atteint le maximum de 2 CEP pour cette commune.',
                ], 422);
            }
        }

        $cep = Cep::create([...$validated, 'user_id' => $userId]);

        return response()->json(
            $cep->load(['departement', 'commune', 'arrondissement']),
            201
        );
    }

    /* ── Participants disponibles (non encore dans un CEP) ────────────── */
    public function membresDisponibles(Request $request, Cep $cep)
    {
        // Vérifie que le CEP appartient bien au conseiller connecté
        if ($cep->user_id !== $request->user()->id) {
            abort(403);
        }

        // IDs déjà dans n'importe quel CEP
        $dejaAffectes = CepMembre::pluck('identification_participant_cep_id')->all();

        $disponibles = IdentificationParticipantCep::with(['departement', 'commune', 'arrondissement'])
            ->where('user_id', $request->user()->id)
            ->whereNotIn('id', $dejaAffectes)
            ->orderBy('nom_producteur')
            ->get();

        return response()->json($disponibles);
    }

    /* ── Ajouter un membre au CEP ─────────────────────────────────────── */
    public function addMembre(Request $request, Cep $cep)
    {
        if ($cep->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'identification_participant_cep_id' => [
                'required', 'integer',
                'exists:identification_participants_cep,id',
            ],
            'responsabilite' => ['nullable', 'string', 'max:255'],
        ]);

        // Règle : un participant ne peut appartenir qu'à un seul CEP
        $existe = CepMembre::where(
            'identification_participant_cep_id',
            $validated['identification_participant_cep_id']
        )->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Ce participant est déjà membre d\'un autre CEP.',
            ], 422);
        }

        $membre = CepMembre::create([
            'cep_id'                            => $cep->id,
            'identification_participant_cep_id' => $validated['identification_participant_cep_id'],
            'responsabilite'                    => $validated['responsabilite'] ?? null,
        ]);

        return response()->json(
            $membre->load('participant.departement', 'participant.commune', 'participant.arrondissement'),
            201
        );
    }

    /* ── Retirer un membre du CEP ─────────────────────────────────────── */
    public function removeMembre(Request $request, Cep $cep, CepMembre $membre)
    {
        if ($cep->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($membre->cep_id !== $cep->id) {
            abort(404);
        }

        $membre->delete();

        return response()->json(['message' => 'Membre retiré du CEP.']);
    }

    /* ── Supprimer un CEP ─────────────────────────────────────────────── */
    public function destroy(Request $request, Cep $cep)
    {
        if ($cep->user_id !== $request->user()->id) {
            abort(403);
        }

        $cep->delete();

        return response()->json(['message' => 'CEP supprimé.']);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\AnimationSessionCep;
use App\Models\ResumeProtocoleExperimentation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnimationSessionCepController extends Controller
{
    /* ── Expérimentations disponibles depuis Résumé protocoles ────────── */
    public function experimentationsDisponibles(Request $request)
    {
        $request->validate(['profil_historique_id' => ['required', 'integer']]);

        $items = ResumeProtocoleExperimentation::with('probleme')
            ->where('user_id', $request->user()->id)
            ->where('profil_historique_id', $request->input('profil_historique_id'))
            ->orderBy('id')
            ->get()
            ->map(fn ($r) => [
                'id'                    => $r->id,
                'titre_experimentation' => $r->titre_experimentation,
                'dispositif_experimental' => $r->dispositif_experimental,
                'sujet_special'         => $r->sujet_special,
                'probleme'              => $r->probleme?->probleme,
            ]);

        return response()->json($items);
    }

    /* ── Liste des lignes d'une session ──────────────────────────────── */
    public function index(Request $request)
    {
        $query = AnimationSessionCep::with('protocole.probleme')
            ->where('user_id', $request->user()->id);

        if ($request->filled('cep_id')) {
            $query->where('cep_id', $request->input('cep_id'));
        }
        if ($request->filled('profil_historique_id')) {
            $query->where('profil_historique_id', $request->input('profil_historique_id'));
        }
        if ($request->filled('date_session')) {
            $query->whereDate('date_session', $request->input('date_session'));
        }

        return response()->json($query->orderBy('id')->get());
    }

    /* ── Enregistrer une session (remplace les lignes existantes) ─────── */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cep_id'                                   => ['nullable', 'integer', 'exists:cep,id'],
            'profil_historique_id'                     => ['nullable', 'integer', 'exists:profil_historique,id'],
            'date_session'                             => ['nullable', 'date'],
            'lignes'                                   => ['required', 'array', 'min:1'],
            'lignes.*.resume_protocole_experimentation_id' => ['required', 'integer', 'exists:resume_protocoles_experimentations,id'],
            'lignes.*.periode_duree'                   => ['nullable', 'string', 'max:255'],
            'lignes.*.superficie_couverte'             => ['nullable', 'numeric', 'min:0'],
            'lignes.*.innovations'                     => ['nullable', 'array'],
            'lignes.*.innovations.*'                   => ['string', 'max:255'],
            'lignes.*.appreciation_generale'           => ['nullable', 'string'],
        ]);

        $userId             = $request->user()->id;
        $cepId              = $validated['cep_id'] ?? null;
        $profilHistoriqueId = $validated['profil_historique_id'] ?? null;
        $dateSession        = $validated['date_session'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $cepId, $profilHistoriqueId, $dateSession) {
            $q = AnimationSessionCep::where('user_id', $userId);
            $cepId ? $q->where('cep_id', $cepId) : $q->whereNull('cep_id');
            $profilHistoriqueId
                ? $q->where('profil_historique_id', $profilHistoriqueId)
                : $q->whereNull('profil_historique_id');
            $dateSession
                ? $q->whereDate('date_session', $dateSession)
                : $q->whereNull('date_session');
            $q->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                AnimationSessionCep::create([
                    'user_id'                             => $userId,
                    'cep_id'                              => $cepId,
                    'profil_historique_id'                => $profilHistoriqueId,
                    'date_session'                        => $dateSession,
                    'resume_protocole_experimentation_id' => $l['resume_protocole_experimentation_id'],
                    'periode_duree'                       => $l['periode_duree']          ?? null,
                    'superficie_couverte'                 => $l['superficie_couverte']    ?? null,
                    'innovations'                         => $l['innovations']             ?? [],
                    'appreciation_generale'               => $l['appreciation_generale']  ?? null,
                ])
            )->all();
        });

        return response()->json([
            'message' => count($saved) . ' ligne(s) enregistrée(s) avec succès !',
            'data'    => $saved,
        ], 201);
    }
}

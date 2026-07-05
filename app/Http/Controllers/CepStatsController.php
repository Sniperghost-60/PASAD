<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Statistiques détaillées des Champs Écoles Paysans (page « Statistiques CEP »).
 *
 * Un Conseiller ne voit que ses propres données ; Superviseur / Administrateur /
 * Super-Admin voient la plateforme entière (+ le pipeline innovation).
 */
class CepStatsController extends Controller
{
    /** Modules de saisie CEP — libellés pour l'onglet « Avancement ». */
    private const MODULES = [
        'profil_historique'                       => 'Profil historique',
        'hierarchisation_domaines_activites'      => "Domaines d'activités",
        'hierarchisation_speculations_agricoles'  => 'Spéculations agricoles',
        'matrice_problemes'                       => 'Problèmes & solutions',
        'curriculum_apprentissage_cep'            => 'Curriculum CEP',
        'resume_protocoles_experimentations'      => 'Protocoles expérimentations',
        'liste_presence_sensibilisation'          => 'Listes de présence',
        'identification_participants_cep'         => 'Participants CEP',
        'base_beneficiaires_intervention'         => 'Base bénéficiaires',
        'cep'                                     => 'Champs-écoles créés',
        'animation_sessions_cep'                  => "Sessions d'animation",
        'bilan_sessions_animation_cep'            => 'Bilans de sessions',
        'organisation_visites_echanges'           => "Organisation visites d'échanges",
        'visites_echanges_commentees'             => 'Visites commentées',
        'difficultes_suggestions'                 => 'Difficultés & suggestions',
        'evolution_rendements_cep'                => 'Rendements CEP',
        'rendement_dispositif'                    => 'Rendement unité de démonstration',
        'rapport_demarrage_cep'                   => 'Rapports de démarrage',
    ];

    public function __invoke(Request $request)
    {
        $user    = $request->user();
        $uid     = $user->id;
        $isAdmin = $user->hasAnyRole(['Super-Admin', 'Administrateur', 'Superviseur']);
        $t       = fn (string $table) => DB::table($table)
            ->when(! $isAdmin, fn ($q) => $q->where("{$table}.user_id", $uid));

        // ── Participants (onglet 1) ─────────────────────────────────────────
        $participantsCommune = $t('identification_participants_cep')
            ->leftJoin('communes as c', 'c.id', '=', 'identification_participants_cep.commune_id')
            ->selectRaw("COALESCE(c.nom, 'Commune non renseignée') AS commune,
                SUM(CASE WHEN sexe = 'M' THEN 1 ELSE 0 END)::int AS hommes,
                SUM(CASE WHEN sexe = 'F' THEN 1 ELSE 0 END)::int AS femmes,
                COUNT(*)::int AS total")
            ->groupBy('c.id', 'c.nom')->orderByDesc('total')->limit(10)->get();

        $repartitionHF = $t('identification_participants_cep')->selectRaw(
            "SUM(CASE WHEN sexe = 'M' THEN 1 ELSE 0 END)::int AS hommes,
             SUM(CASE WHEN sexe = 'F' THEN 1 ELSE 0 END)::int AS femmes"
        )->first();

        $categoriesAge = $t('identification_participants_cep')
            ->whereNotNull('categorie_age')
            ->selectRaw('categorie_age, COUNT(*)::int AS nb')
            ->groupBy('categorie_age')->orderBy('categorie_age')->get();

        $typesProducteur = $t('base_beneficiaires_intervention')
            ->whereNotNull('type_producteur')->where('type_producteur', '!=', '')
            ->selectRaw('type_producteur, COUNT(*)::int AS nb')
            ->groupBy('type_producteur')->orderByDesc('nb')->get();

        // ── Rendements & impact (onglet 2) ──────────────────────────────────
        $rendements = $t('rendement_dispositif')
            ->whereNotNull('culture_technologie')
            ->selectRaw('culture_technologie AS culture,
                ROUND(AVG(rendement_annee_n1)::numeric, 1)             AS moy_n1,
                ROUND(AVG(rendement_annee_n_temoin)::numeric, 1)       AS moy_temoin,
                ROUND(AVG(rendement_annee_n_technologie)::numeric, 1)  AS moy_tech,
                COUNT(*)::int AS nb')
            ->groupBy('culture_technologie')->orderByDesc('nb')->limit(8)->get();

        $gainRendement = $t('rendement_dispositif')
            ->whereNotNull('rendement_annee_n_technologie')
            ->whereNotNull('rendement_annee_n_temoin')
            ->where('rendement_annee_n_temoin', '>', 0)
            ->whereNotNull('culture_technologie')
            ->selectRaw('culture_technologie AS culture,
                ROUND(AVG((rendement_annee_n_technologie - rendement_annee_n_temoin)
                    / rendement_annee_n_temoin * 100)::numeric, 1) AS gain_pct,
                COUNT(*)::int AS nb')
            ->groupBy('culture_technologie')->orderByDesc('gain_pct')->limit(8)->get();

        $dispositifs = $t('evolution_rendements_cep')
            ->leftJoin('communes as c', 'c.id', '=', 'evolution_rendements_cep.commune_id')
            ->whereNotNull('culture')
            ->selectRaw("culture || COALESCE(' — ' || c.nom, '') AS label,
                ROUND(AVG(rendement_dispositif_1)::numeric, 1) AS d1,
                ROUND(AVG(rendement_dispositif_2)::numeric, 1) AS d2,
                ROUND(AVG(rendement_dispositif_3)::numeric, 1) AS d3,
                ROUND(AVG(rendement_dispositif_4)::numeric, 1) AS d4")
            ->groupBy('culture', 'c.nom')->limit(8)->get();

        // ── Sessions & visites (onglet 3) ───────────────────────────────────
        $depuis = now()->subMonths(11)->startOfMonth();

        $sessionsMois = $t('bilan_sessions_animation_cep')
            ->whereNotNull('date_session')->where('date_session', '>=', $depuis)
            ->selectRaw("TO_CHAR(date_session, 'YYYY-MM') AS mois,
                COUNT(*)::int AS sessions,
                COALESCE(SUM(participation_total), 0)::int AS participants")
            ->groupBy('mois')->get()->keyBy('mois');

        $visitesMois = $t('visites_echanges_commentees')
            ->whereNotNull('date')->where('date', '>=', $depuis)
            ->selectRaw("TO_CHAR(date, 'YYYY-MM') AS mois,
                COUNT(*)::int AS visites,
                COALESCE(SUM(visiteurs_total), 0)::int AS visiteurs")
            ->groupBy('mois')->get()->keyBy('mois');

        $activiteMensuelle = $sessionsMois->keys()->merge($visitesMois->keys())->unique()->sort()
            ->map(fn ($m) => [
                'mois'         => $m,
                'sessions'     => (int) ($sessionsMois[$m]->sessions ?? 0),
                'participants' => (int) ($sessionsMois[$m]->participants ?? 0),
                'visites'      => (int) ($visitesMois[$m]->visites ?? 0),
                'visiteurs'    => (int) ($visitesMois[$m]->visiteurs ?? 0),
            ])->values();

        $totauxActivite = [
            'sessions'     => $t('bilan_sessions_animation_cep')->count(),
            'participants' => (int) $t('bilan_sessions_animation_cep')->sum('participation_total'),
            'visites'      => $t('visites_echanges_commentees')->count(),
            'visiteurs'    => (int) $t('visites_echanges_commentees')->sum('visiteurs_total'),
        ];

        // ── Terrain (onglet 4) ──────────────────────────────────────────────
        $topSpeculations = $t('identification_participants_cep')
            ->whereNotNull('speculation')->where('speculation', '!=', '')
            ->selectRaw('speculation, COUNT(*)::int AS nb')
            ->groupBy('speculation')->orderByDesc('nb')->limit(6)->get();

        $pratiques = [];
        foreach (['pratique_agroecologique_1', 'pratique_agroecologique_2', 'pratique_agroecologique_3'] as $col) {
            $t('base_beneficiaires_intervention')
                ->whereNotNull($col)->where($col, '!=', '')
                ->selectRaw("{$col} AS pratique, COUNT(*)::int AS nb")
                ->groupBy($col)->get()
                ->each(function ($r) use (&$pratiques) {
                    $pratiques[$r->pratique] = ($pratiques[$r->pratique] ?? 0) + $r->nb;
                });
        }
        arsort($pratiques);
        $topPratiques = collect(array_slice($pratiques, 0, 6, true))
            ->map(fn ($nb, $p) => ['pratique' => $p, 'nb' => $nb])->values();

        $topDifficultes = $t('difficultes_suggestions')
            ->whereNotNull('difficulte')->where('difficulte', '!=', '')
            ->selectRaw('difficulte, COUNT(*)::int AS nb')
            ->groupBy('difficulte')->orderByDesc('nb')->limit(5)->get();

        // ── Avancement des modules (onglet 5) ───────────────────────────────
        $avancement = collect(self::MODULES)
            ->map(fn ($label, $table) => ['label' => $label, 'valeur' => $t($table)->count()])
            ->values();

        // ── Pipeline innovation (supervision uniquement) ────────────────────
        $pipeline = null;
        if ($isAdmin) {
            $pipeline = [
                'problemes'        => DB::table('matrice_problemes')->count(),
                'pertinents'       => DB::table('matrice_problemes')->where('est_pertinent', true)->count(),
                'curriculum'       => DB::table('curriculum_apprentissage_cep')->distinct('matrice_probleme_id')->count('matrice_probleme_id'),
                'experimentations' => DB::table('resume_protocoles_experimentations')->count(),
            ];
        }

        return response()->json([
            'participants_commune' => $participantsCommune,
            'repartition_hf'       => $repartitionHF,
            'categories_age'       => $categoriesAge,
            'types_producteur'     => $typesProducteur,
            'rendements'           => $rendements,
            'gain_rendement'       => $gainRendement,
            'dispositifs'          => $dispositifs,
            'activite_mensuelle'   => $activiteMensuelle,
            'totaux_activite'      => $totauxActivite,
            'top_speculations'     => $topSpeculations,
            'top_pratiques'        => $topPratiques,
            'top_difficultes'      => $topDifficultes,
            'avancement'           => $avancement,
            'pipeline'             => $pipeline,
        ]);
    }
}

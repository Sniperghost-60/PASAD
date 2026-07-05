<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Statistiques du tableau de bord.
 *
 * Un Conseiller ne voit que ses propres données (filtrables par commune) ;
 * Superviseur / Administrateur / Super-Admin voient la plateforme entière
 * et reçoivent en plus le bloc `admin` (pilotage du programme).
 */
class DashboardStatsController extends Controller
{
    /** Tables de saisie filtrables par commune_id directement. */
    private const TABLES_BY_COMMUNE = [
        'profil_historique', 'hierarchisation_domaines_activites',
        'hierarchisation_speculations_agricoles', 'matrice_problemes',
        'curriculum_apprentissage_cep', 'resume_protocoles_experimentations',
        'liste_presence_sensibilisation', 'identification_participants_cep',
        'base_beneficiaires_intervention', 'cep',
    ];

    /** Tables de saisie rattachées à un CEP (filtrables via cep_id). */
    private const TABLES_BY_CEP = [
        'animation_sessions_cep', 'bilan_sessions_animation_cep',
        'organisation_visites_echanges', 'visites_echanges_commentees',
        'difficultes_suggestions', 'evolution_rendements_cep',
        'rendement_dispositif', 'rapport_demarrage_cep',
    ];

    public function __invoke(Request $request)
    {
        $user      = $request->user();
        $isAdmin   = $user->hasAnyRole(['Super-Admin', 'Administrateur', 'Superviseur']);
        $uid       = $user->id;
        $communeId = $request->filled('commune_id') ? (int) $request->input('commune_id') : null;

        // IDs des CEP dans le périmètre (pour filtrer les tables liées au CEP)
        $cepIds = null;
        if ($communeId) {
            $q = DB::table('cep')->where('commune_id', $communeId);
            if (! $isAdmin) $q->where('user_id', $uid);
            $cepIds = $q->pluck('id')->all();
        }

        $scope = function ($query, string $table) use ($isAdmin, $uid, $communeId, $cepIds) {
            if (! $isAdmin) $query->where("{$table}.user_id", $uid);
            if ($communeId) {
                if (in_array($table, self::TABLES_BY_COMMUNE, true)) {
                    $query->where("{$table}.commune_id", $communeId);
                } elseif (in_array($table, self::TABLES_BY_CEP, true) && $cepIds !== null) {
                    $query->whereIn("{$table}.cep_id", $cepIds);
                }
            }
            return $query;
        };
        $t = fn (string $table) => $scope(DB::table($table), $table);

        // ── Compteurs par module (navigation + volumes) ─────────────────────
        $allTables = array_merge(self::TABLES_BY_COMMUNE, self::TABLES_BY_CEP);
        $modules   = collect($allTables)->mapWithKeys(fn ($tb) => [$tb => $t($tb)->count()])->all();

        // ── Indicateurs clés ────────────────────────────────────────────────
        $totalPart  = $t('identification_participants_cep')->count();
        $femmesPart = $t('identification_participants_cep')->where('sexe', 'F')->count();

        $kpi = [
            'cep'               => $modules['cep'],
            'cep_membres'       => DB::table('cep_membres')
                ->when($cepIds !== null, fn ($q) => $q->whereIn('cep_id', $cepIds))
                ->when(! $isAdmin && $cepIds === null, fn ($q) => $q->whereIn(
                    'cep_id', DB::table('cep')->where('user_id', $uid)->pluck('id')
                ))
                ->count(),
            'beneficiaires'     => $t('base_beneficiaires_intervention')
                ->whereNotNull('contact1_producteur')
                ->distinct('contact1_producteur')->count('contact1_producteur'),
            'participants'      => $totalPart,
            'participants_femmes' => $femmesPart,
            'taux_feminisation' => $totalPart > 0 ? round($femmesPart / $totalPart * 100, 1) : 0,
            'superficie_ha'     => round((float) $t('animation_sessions_cep')->sum('superficie_couverte'), 1),
            'sessions'          => $modules['animation_sessions_cep'],
            'aaes'              => (int) $t('bilan_sessions_animation_cep')->sum('nb_aaes'),
            'difficultes'       => $modules['difficultes_suggestions'],
        ];

        // ── Participation aux sessions (H/F, jeunes en sous-ensemble) ──────
        $participation = $t('bilan_sessions_animation_cep')->selectRaw(
            'COALESCE(SUM(participation_total),0)::int  AS total,
             COALESCE(SUM(participation_h),0)::int      AS hommes,
             COALESCE(SUM(participation_f),0)::int      AS femmes,
             COALESCE(SUM(participation_jeunes),0)::int AS jeunes'
        )->first();

        // ── Saisies mensuelles (12 mois, toutes tables de saisie) ──────────
        $unionSql = collect($allTables)
            ->map(fn ($tb) => "SELECT created_at, user_id FROM {$tb}")
            ->implode(' UNION ALL ');
        $userClause = $isAdmin ? '' : 'AND user_id = '.$uid;
        $saisiesMensuelles = DB::select("
            SELECT TO_CHAR(created_at, 'YYYY-MM') AS mois, COUNT(*)::int AS nb
            FROM ({$unionSql}) a
            WHERE created_at >= ? {$userClause}
            GROUP BY mois ORDER BY mois
        ", [now()->subMonths(11)->startOfMonth()]);

        // ── Répartitions terrain ────────────────────────────────────────────
        $topSpeculations = $t('identification_participants_cep')
            ->whereNotNull('speculation')->where('speculation', '!=', '')
            ->selectRaw('speculation, COUNT(*)::int AS nb')
            ->groupBy('speculation')->orderByDesc('nb')->limit(6)->get();

        $categoriesAge = $t('identification_participants_cep')
            ->whereNotNull('categorie_age')
            ->selectRaw('categorie_age, COUNT(*)::int AS nb')
            ->groupBy('categorie_age')->orderBy('categorie_age')->get();

        $topDifficultes = $t('difficultes_suggestions')
            ->whereNotNull('difficulte')->where('difficulte', '!=', '')
            ->selectRaw('difficulte, COUNT(*)::int AS nb')
            ->groupBy('difficulte')->orderByDesc('nb')->limit(5)->get();

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
        $topPratiques = collect(array_slice($pratiques, 0, 5, true))
            ->map(fn ($nb, $p) => ['pratique' => $p, 'nb' => $nb])->values();

        return response()->json([
            'modules'            => $modules,
            'kpi'                => $kpi,
            'participation'      => $participation,
            'saisies_mensuelles' => $saisiesMensuelles,
            'top_speculations'   => $topSpeculations,
            'categories_age'     => $categoriesAge,
            'top_difficultes'    => $topDifficultes,
            'top_pratiques'      => $topPratiques,
            'admin'              => $isAdmin ? $this->adminStats($allTables) : null,
        ]);
    }

    /**
     * Bloc de pilotage réservé Superviseur / Administrateur / Super-Admin :
     * couverture territoriale, impact rendement, pipeline innovation, équipe.
     */
    private function adminStats(array $allTables): array
    {
        // Couverture territoriale
        $couverture = [
            'communes_couvertes'        => DB::table('cep')->whereNotNull('commune_id')->distinct('commune_id')->count('commune_id'),
            'communes_total'            => DB::table('communes')->count(),
            'arrondissements_couverts'  => DB::table('cep')->whereNotNull('arrondissement_id')->distinct('arrondissement_id')->count('arrondissement_id'),
            'arrondissements_total'     => DB::table('arrondissements')->count(),
        ];

        // Structuration des CEP
        $nbCep        = DB::table('cep')->count();
        $nbAvecRapport = DB::table('rapport_demarrage_cep')->count();
        $structuration = [
            'taux_avec_rapport' => $nbCep > 0 ? round($nbAvecRapport / $nbCep * 100, 1) : 0,
            'avec_comite'       => DB::table('rapport_demarrage_cep')->where('comite_en_place', true)->count(),
            'sans_comite'       => DB::table('rapport_demarrage_cep')->where('comite_en_place', false)->count(),
        ];

        // Impact : gain de rendement technologie vs témoin, par culture
        $gainRendement = DB::table('rendement_dispositif')
            ->whereNotNull('rendement_annee_n_technologie')
            ->whereNotNull('rendement_annee_n_temoin')
            ->where('rendement_annee_n_temoin', '>', 0)
            ->whereNotNull('culture_technologie')
            ->selectRaw("culture_technologie AS culture,
                ROUND(AVG((rendement_annee_n_technologie - rendement_annee_n_temoin) / rendement_annee_n_temoin * 100)::numeric, 1) AS gain_pct,
                COUNT(*)::int AS nb")
            ->groupBy('culture_technologie')->orderByDesc('gain_pct')->limit(6)->get();

        // Pipeline innovation : problème → pertinent → curriculum → expérimentation
        $pipeline = [
            'problemes'        => DB::table('matrice_problemes')->count(),
            'pertinents'       => DB::table('matrice_problemes')->where('est_pertinent', true)->count(),
            'curriculum'       => DB::table('curriculum_apprentissage_cep')->distinct('matrice_probleme_id')->count('matrice_probleme_id'),
            'experimentations' => DB::table('resume_protocoles_experimentations')->count(),
        ];

        // Équipe
        $usersParRole = [
            'Super-Admin'    => User::role('Super-Admin')->count(),
            'Administrateur' => User::role('Administrateur')->count(),
            'Superviseur'    => User::role('Superviseur')->count(),
            'Conseiller'     => User::role('Conseiller')->count(),
        ];

        $actifsCeMois = DB::table('profil_historique')
            ->where('created_at', '>=', now()->startOfMonth())
            ->distinct()->pluck('user_id');
        $conseillersInactifs = User::role('Conseiller')->whereNotIn('id', $actifsCeMois)->count();

        // Activité totale par conseiller (toutes tables de saisie)
        $activiteConseillers = [];
        $conseillerIds = User::role('Conseiller')->pluck('id');
        if ($conseillerIds->isNotEmpty()) {
            $unionSql = collect($allTables)->map(fn ($tb) => "SELECT user_id FROM {$tb}")->implode(' UNION ALL ');
            $idList   = $conseillerIds->implode(',');
            $activiteConseillers = DB::select("
                SELECT u.id, u.name, COUNT(a.user_id)::int AS nb
                FROM users u
                LEFT JOIN ({$unionSql}) a ON a.user_id = u.id
                WHERE u.id IN ({$idList})
                GROUP BY u.id, u.name
                ORDER BY nb DESC
                LIMIT 8
            ");
        }

        return [
            'utilisateurs'          => User::count(),
            'users_par_role'        => $usersParRole,
            'conseillers_inactifs'  => $conseillersInactifs,
            'couverture'            => $couverture,
            'structuration'         => $structuration,
            'gain_rendement'        => $gainRendement,
            'pipeline'              => $pipeline,
            'activite_conseillers'  => $activiteConseillers,
        ];
    }
}

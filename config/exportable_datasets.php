<?php

use App\Models;

/*
|--------------------------------------------------------------------------
| Jeux de données exportables (Export CSV / XLSX / PDF)
|--------------------------------------------------------------------------
|
| Registre blanc-listé des modèles exportables depuis le tableau de bord.
| La clé (slug) est celle utilisée dans l'URL de l'API d'export ; seules
| les entrées listées ici peuvent être exportées.
|
| Les groupes reproduisent l'organisation des modules dans la barre
| latérale : ils servent à la fois au classement de l'export « par fiche »
| et à l'export groupé « par module » (un fichier par groupe complet).
|
*/

return [

    // ── Fiches CEP ────────────────────────────────────────────────────────
    'profil-historique'                    => ['label' => 'Profil historique',                    'group' => 'Fiches CEP', 'model' => Models\ProfilHistorique::class, 'highlight_content_headers' => true],
    'hierarchisation-domaines-activites'   => ['label' => 'Hiérarchisation domaines d\'activités', 'sheet' => 'Domaines d\'activités', 'group' => 'Fiches CEP', 'model' => Models\HierarchisationDomaineActivite::class],
    'hierarchisation-domaines-activites-village' => ['label' => 'Hiérarchisation domaines d\'activités — Par village', 'sheet' => 'Domaines — Par village', 'group' => 'Fiches CEP', 'model' => Models\HierarchisationDomaineActivite::class, 'blocks' => 'domaine_activite', 'band_label' => 'Moyens de subsistance'],
    'hierarchisation-speculations-agricoles' => ['label' => 'Hiérarchisation spéculations agricoles', 'sheet' => 'Spéculations agricoles', 'group' => 'Fiches CEP', 'model' => Models\HierarchisationSpeculationAgricole::class],
    'hierarchisation-speculations-agricoles-village' => ['label' => 'Hiérarchisation spéculations agricoles — Par village', 'sheet' => 'Spéculations — Par village', 'group' => 'Fiches CEP', 'model' => Models\HierarchisationSpeculationAgricole::class, 'pivot' => 'speculation'],
    'matrice-problemes'                    => ['label' => 'Matrice — Problèmes identifiés',        'group' => 'Fiches CEP', 'model' => Models\MatriceProbleme::class],
    'matrice-solutions'                    => ['label' => 'Matrice — Solutions proposées',         'group' => 'Fiches CEP', 'model' => Models\MatriceProblemeSolution::class],
    'curriculum-apprentissage-cep'         => ['label' => 'Curriculum apprentissage CEP',          'group' => 'Fiches CEP', 'model' => Models\CurriculumApprentissageCep::class],
    'resume-protocoles-experimentations'   => ['label' => 'Résumé protocoles expérimentation', 'sheet' => 'Protocoles expérimentation',     'group' => 'Fiches CEP', 'model' => Models\ResumeProtocoleExperimentation::class],

    // ── Sensibilisation ───────────────────────────────────────────────────
    'liste-presence-sensibilisation'       => ['label' => 'Liste de présence sensibilisation', 'sheet' => 'Liste de présence',     'group' => 'Sensibilisation', 'model' => Models\ListePresenceSensibilisation::class],
    'identification-participants-cep'      => ['label' => 'Identification participants CEP',       'group' => 'Sensibilisation', 'model' => Models\IdentificationParticipantCep::class],

    // ── Activités CEP ─────────────────────────────────────────────────────
    'cep'                                  => ['label' => 'CEP (Champs Écoles Paysans)',           'group' => 'Activités CEP', 'model' => Models\Cep::class],
    'animation-sessions-cep'               => ['label' => 'Animation sessions CEP',                'group' => 'Activités CEP', 'model' => Models\AnimationSessionCep::class],
    'base-beneficiaires-intervention'      => ['label' => 'Base bénéficiaires intervention',       'group' => 'Activités CEP', 'model' => Models\BaseBeneficiaireIntervention::class],
    'bilan-sessions-animation-cep'         => ['label' => 'Bilan mensuel des sessions d\'animation du CEP', 'sheet' => 'Bilan sessions animation CEP', 'group' => 'Activités CEP', 'model' => Models\BilanSessionAnimationCep::class, 'grid_header' => 'bilan_sessions'],
    'organisation-visites-echanges'        => ['label' => 'Organisation visites d\'échanges',      'group' => 'Activités CEP', 'model' => Models\OrganisationVisiteEchange::class, 'grid_header' => 'organisation_visites'],
    'visites-echanges-commentees'          => ['label' => 'Visites échanges commentées',           'group' => 'Activités CEP', 'model' => Models\VisiteEchangeCommentee::class, 'grid_header' => 'visites_commentees'],
    'difficultes-suggestions'              => ['label' => 'Difficultés & suggestions',             'group' => 'Activités CEP', 'model' => Models\DifficulteSuggestion::class],
    'evolution-rendements-cep'             => ['label' => 'Évolution rendements CEP',              'group' => 'Activités CEP', 'model' => Models\EvolutionRendementCep::class, 'grid_header' => 'evolution_rendements'],
    'rendement-dispositif'                 => ['label' => 'Rendement UD',                          'sheet' => 'Rendement dispositif', 'group' => 'Activités CEP', 'model' => Models\RendementDispositif::class, 'grid_header' => 'rendement_dispositif'],
    'rapport-demarrage-cep'                => ['label' => 'Rapport démarrage CEP',                 'group' => 'Activités CEP', 'model' => Models\RapportDemarrageCep::class],

    // ── CAI — Phase 1 (Préliminaire) ──────────────────────────────────────
    'cai-liste-producteurs'          => ['label' => 'Liste producteurs',    'group' => 'CAI — Phase 1 (Préliminaire)', 'model' => Models\CaiListeProducteur::class],
    'cai-liste-organisations'        => ['label' => 'Liste organisations',  'group' => 'CAI — Phase 1 (Préliminaire)', 'model' => Models\CaiListeOrganisation::class],
    'cai-negociation-accord'         => ['label' => 'Négociation accord',   'group' => 'CAI — Phase 1 (Préliminaire)', 'model' => Models\CaiNegociationAccord::class,
        'periode_columns' => [
            'reorder' => ['numero', 'contraintes_a_lever', 'activites', 'responsables', 'periode_debut', 'periode_fin', 'moyens_conseiller', 'moyens_op_exploitation'],
            'debut' => 'periode_debut', 'fin' => 'periode_fin', 'target' => 'periode_execution', 'before' => 'periode_debut',
        ],
    ],

    // ── CAI — Phase 2 (Diagnostic) ────────────────────────────────────────
    'cai-marches-caracterisation'    => ['label' => 'Caractérisation marchés agroécologiques', 'sheet' => 'Caractérisation marchés', 'group' => 'CAI — Phase 2 (Diagnostic)', 'model' => Models\CaiMarcheCaracterisation::class],
    'cai-facteurs-limitant'          => ['label' => 'Facteurs limitants (FFOM)',               'group' => 'CAI — Phase 2 (Diagnostic)', 'model' => Models\CaiFacteurLimitant::class],
    'cai-etude-marche'               => ['label' => 'Étude de marché',                          'group' => 'CAI — Phase 2 (Diagnostic)', 'model' => Models\CaiEtudeMarche::class],
    'cai-agroecologie-producteurs'   => ['label' => 'Agroécologie producteurs',                 'group' => 'CAI — Phase 2 (Diagnostic)', 'model' => Models\CaiAgroecologieProducteur::class],
    'cai-appui-marche'               => ['label' => 'Appui accès aux marchés',                  'group' => 'CAI — Phase 2 (Diagnostic)', 'model' => Models\CaiAppuiMarche::class,
        'keyed_rows' => ['path' => null, 'entity_label' => 'marche', 'key_labels' => ['marche1' => 'Marché 1', 'marche2' => 'Marché 2', 'marche3' => 'Marché 3']],
        'computed_columns' => [
            'charges_totales' => ['op' => 'sum', 'keys' => ['pretransformation', 'transport', 'emballage', 'entreposage', 'produits_conservation', 'interets_commercialisation', 'amortissement', 'interets_investissement', 'inspection_conseil', 'taxes_marche', 'intermediaires', 'promotion_publicite', 'pertes']],
            'marge_brute'     => ['op' => 'sub', 'keys' => ['produit_brut', 'charges_totales']],
        ],
    ],
    'cai-programmation-marche'       => ['label' => 'Programmation marché',                     'group' => 'CAI — Phase 2 (Diagnostic)', 'model' => Models\CaiProgrammationMarche::class,
        'flat_matrix' => [
            'slugs' => [
                'negocier_transport' => 'Négocier le transport', 'negocier_entrepots' => 'Négocier les entrepôts', 'negocier_acheteurs' => 'Négocier les acheteurs',
                'faire_inspecter' => 'Faire inspecter', 'faire_certifier' => 'Faire certifier ou labeliser', 'solliciter_conseil' => 'Solliciter du conseil',
                'conditionnement' => 'Conditionnement', 'transport_produits' => 'Transport des produits', 'exposition_livraison' => 'Exposition ou livraison',
            ],
            'dim2' => ['m1' => 'Mois 1', 'm2' => 'Mois 2', 'm3' => 'Mois 3'],
            'dim3' => ['d1' => 'Décade 1', 'd2' => 'Décade 2', 'd3' => 'Décade 3'],
        ],
    ],

    // ── CAI — Phase 4 (Mise en œuvre) ─────────────────────────────────────
    'cai-programme-quinzaine'        => ['label' => 'Programme de la quinzaine', 'group' => 'CAI — Phase 4 (Mise en œuvre)', 'model' => Models\CaiProgrammeQuinzaine::class, 'json_rows' => [null]],
    'cai-journal-caisse'             => ['label' => 'Journal de caisse',         'group' => 'CAI — Phase 4 (Mise en œuvre)', 'model' => Models\CaiJournalCaisse::class, 'ledger' => ['report_path' => 'report', 'entree_keys' => ['encaissements', 'encaissements_excep'], 'sortie_keys' => ['decaissements', 'decaissements_excep'], 'balance_key' => 'solde'], 'grid_header' => 'cai_journal_caisse'],
    'cai-fiche-stock'                => ['label' => 'Fiche de stock',            'group' => 'CAI — Phase 4 (Mise en œuvre)', 'model' => Models\CaiFicheStock::class, 'ledger' => ['report_path' => 'report.stock_qte', 'entree_keys' => ['entree_qte'], 'sortie_keys' => ['sortie_qte'], 'balance_key' => 'stock', 'trailing_keys' => ['observations']], 'grid_header' => 'cai_fiche_stock'],

    // ── CAI — Phase 5 (Évaluation) ────────────────────────────────────────
    'cai-evolution-rendements-cep'   => ['label' => 'Évolution rendements CEP',        'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiEvolutionRendementsCep::class, 'json_rows' => ['lignes']],
    'cai-evolution-rendements-ud'    => ['label' => 'Évolution rendements UD',         'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiEvolutionRendementsUd::class, 'json_rows' => ['lignes']],
    'cai-evolution-produits-chimiques' => ['label' => 'Évolution produits chimiques',  'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiEvolutionProduitsChimiques::class, 'json_rows' => ['lignes'], 'json_rows_total' => ['qte_n2', 'qte_n1', 'qte_n']],
    'cai-evolution-produits-organiques' => ['label' => 'Évolution produits organiques', 'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiEvolutionProduitsOrganiques::class, 'json_rows' => ['lignes'], 'json_rows_total' => ['qte_n1', 'montant_n1', 'qte_n', 'montant_n', 'qte_n_plus1', 'montant_n_plus1'], 'grid_header' => 'cai_produits_organiques'],
    'cai-evolution-especes'          => ['label' => 'Évolution espèces cultivées',     'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiEvolutionEspeces::class, 'json_rows' => ['Animale' => 'lignes_animale', 'Végétale' => 'lignes_vegetale'], 'json_rows_total' => ['nb_n1', 'nb_n', 'nb_n_plus1'], 'json_rows_total_group' => 'section'],
    'cai-analyse-qualite-sols'       => ['label' => 'Analyse qualité des sols',        'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiAnalyseQualiteSols::class,
        'keyed_rows' => ['path' => 'scores', 'entity_label' => 'indicateur', 'key_labels' => [
            'structure' => 'Structure', 'compactage' => 'Compactage', 'profondeur_sol' => 'Profondeur du sol superficiel',
            'statut_residus' => 'Statut des résidus', 'couleur_odeur_mo' => 'Couleur, odeur et matière organique',
            'retention_eau' => "Rétention d'eau (niveau d'humidité après irrigation ou pluie)",
        ]],
    ],
    'cai-cout-transaction'           => ['label' => 'Coût de transaction / marges',    'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiCoutTransaction::class,
        'keyed_rows' => ['path' => 'marches', 'entity_label' => 'marche', 'key_labels' => ['m1' => 'Marché 1', 'm2' => 'Marché 2', 'm3' => 'Marché 3']],
        'computed_columns' => [
            'charges_totales' => ['op' => 'sum', 'keys' => ['pre_transformation', 'transport', 'emballage', 'entreposage', 'produits_conservation', 'interets_commercialisation', 'amortissement', 'interets_investissement', 'inspection_conseil', 'taxes_marche', 'intermediaires', 'promotion_publicite', 'pertes']],
            'marge_brute'     => ['op' => 'sub', 'keys' => ['produit_brut', 'pre_transformation', 'transport', 'emballage', 'entreposage', 'produits_conservation', 'interets_commercialisation', 'inspection_conseil', 'taxes_marche', 'intermediaires', 'promotion_publicite', 'pertes']],
            'marge_nette'     => ['op' => 'sub', 'keys' => ['marge_brute', 'amortissement', 'interets_investissement']],
        ],
    ],
    'cai-evaluation-institutionnelle' => ['label' => 'Évaluation institutionnelle',    'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiEvaluationInstitutionnelle::class,
        'keyed_rows' => ['path' => 'items', 'entity_label' => 'critere', 'key_labels' => [
            'relations_transporteurs' => 'Relations avec les transporteurs', 'relation_magasiniers' => 'Relation avec les magasiniers (entrepôts)',
            'relation_acheteurs' => 'Relation avec les acheteurs', 'relation_inspecteurs' => 'Relation avec les inspecteurs',
            'relation_certification' => 'Relation avec les services de certification', 'relation_promotion' => 'Relation avec les services de promotion',
            'relation_vulgarisation' => 'Relation avec les services de vulgarisation et de conseil',
            'conditionnement' => 'Conditionnement', 'transport_produits' => 'Transport des produits', 'exposition_livraison' => 'Exposition ou livraison',
        ]],
    ],
    'cai-evaluation-organisationnelle' => ['label' => 'Évaluation organisationnelle',  'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiEvaluationOrganisationnelle::class,
        'keyed_rows' => ['path' => 'items', 'entity_label' => 'critere', 'key_labels' => [
            'quantite_prevue' => 'Quantité prévue de produit', 'qualite_prevue' => 'Qualité prévue de produit',
            'periode_livraison' => 'Période de livraison de produit', 'marches_vises' => 'Marchés visés pour le produit',
            'mobilisation_mo' => "Mobilisation de la main d'œuvre", 'prix_vente_planifie' => 'Prix de vente planifié',
            'mode_remboursement' => 'Mode de remboursement', 'organisation_interne' => 'Organisation interne',
        ]],
    ],
    'cai-evaluation-sociale'         => ['label' => 'Évaluation sociale',              'group' => 'CAI — Phase 5 (Évaluation)', 'model' => Models\CaiEvaluationSociale::class,
        'keyed_rows' => ['path' => 'items', 'entity_label' => 'critere', 'key_labels' => [
            'inclusion_sociale' => 'Inclusion sociale (participation des femmes, jeunes et groupes vulnérables)',
            'prise_decisions' => 'Prise des décisions participative', 'repartition_benefices' => 'Répartition équitable des bénéfices',
            'amelioration_revenus' => 'Amélioration des revenus', 'acces_services' => "Accès aux services d'éducation, de santé, de logement, etc.",
            'acces_marches' => 'Accès à divers marchés', 'amelioration_canaux' => 'Amélioration des canaux de distribution des produits',
            'pratiques_agroecologiques' => 'Application de pratiques agroécologiques', 'impact_environnemental' => 'Impact environnemental positif',
            'satisfaction_producteurs' => 'Satisfaction globale des producteurs', 'autres' => 'Autre(s)',
        ]],
    ],

    // ── Administration ────────────────────────────────────────────────────
    'utilisateurs' => ['label' => 'Utilisateurs', 'group' => 'Administration', 'model' => Models\User::class],

];

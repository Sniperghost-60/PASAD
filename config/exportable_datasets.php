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
*/

return [

    // ── Administration ──────────────────────────────────────────────────
    'utilisateurs' => ['label' => 'Utilisateurs',                     'group' => 'Administration', 'model' => Models\User::class],
    'cep'          => ['label' => 'CEP (Champs Écoles Paysans)',      'group' => 'Administration', 'model' => Models\Cep::class],

    // ── Formulaires CEP ──────────────────────────────────────────────────
    'profil-historique'                    => ['label' => 'Profil historique',                    'group' => 'Formulaires CEP', 'model' => Models\ProfilHistorique::class],
    'hierarchisation-domaines-activites'   => ['label' => 'Hiérarchisation domaines d\'activités', 'group' => 'Formulaires CEP', 'model' => Models\HierarchisationDomaineActivite::class],
    'hierarchisation-speculations-agricoles' => ['label' => 'Hiérarchisation spéculations agricoles', 'group' => 'Formulaires CEP', 'model' => Models\HierarchisationSpeculationAgricole::class],
    'matrice-problemes'                    => ['label' => 'Matrice — Problèmes identifiés',        'group' => 'Formulaires CEP', 'model' => Models\MatriceProbleme::class],
    'matrice-solutions'                    => ['label' => 'Matrice — Solutions proposées',         'group' => 'Formulaires CEP', 'model' => Models\MatriceProblemeSolution::class],
    'curriculum-apprentissage-cep'         => ['label' => 'Curriculum apprentissage CEP',          'group' => 'Formulaires CEP', 'model' => Models\CurriculumApprentissageCep::class],
    'resume-protocoles-experimentations'   => ['label' => 'Résumé protocoles expérimentation',     'group' => 'Formulaires CEP', 'model' => Models\ResumeProtocoleExperimentation::class],
    'liste-presence-sensibilisation'       => ['label' => 'Liste de présence sensibilisation',     'group' => 'Formulaires CEP', 'model' => Models\ListePresenceSensibilisation::class],
    'identification-participants-cep'      => ['label' => 'Identification participants CEP',       'group' => 'Formulaires CEP', 'model' => Models\IdentificationParticipantCep::class],
    'animation-sessions-cep'               => ['label' => 'Animation sessions CEP',                'group' => 'Formulaires CEP', 'model' => Models\AnimationSessionCep::class],
    'base-beneficiaires-intervention'      => ['label' => 'Base bénéficiaires intervention',       'group' => 'Formulaires CEP', 'model' => Models\BaseBeneficiaireIntervention::class],
    'bilan-sessions-animation-cep'         => ['label' => 'Bilan sessions animation CEP',          'group' => 'Formulaires CEP', 'model' => Models\BilanSessionAnimationCep::class],
    'organisation-visites-echanges'        => ['label' => 'Organisation visites d\'échanges',      'group' => 'Formulaires CEP', 'model' => Models\OrganisationVisiteEchange::class],
    'visites-echanges-commentees'          => ['label' => 'Visites échanges commentées',           'group' => 'Formulaires CEP', 'model' => Models\VisiteEchangeCommentee::class],
    'difficultes-suggestions'              => ['label' => 'Difficultés & suggestions',             'group' => 'Formulaires CEP', 'model' => Models\DifficulteSuggestion::class],
    'evolution-rendements-cep'             => ['label' => 'Évolution rendements CEP',              'group' => 'Formulaires CEP', 'model' => Models\EvolutionRendementCep::class],
    'rendement-dispositif'                 => ['label' => 'Rendement dispositif',                  'group' => 'Formulaires CEP', 'model' => Models\RendementDispositif::class],
    'rapport-demarrage-cep'                => ['label' => 'Rapport démarrage CEP',                 'group' => 'Formulaires CEP', 'model' => Models\RapportDemarrageCep::class],

    // ── CAI (Conseil Agricole Intégré) ──────────────────────────────────
    'cai-liste-producteurs'          => ['label' => 'CAI — Liste producteurs',              'group' => 'CAI', 'model' => Models\CaiListeProducteur::class],
    'cai-liste-organisations'        => ['label' => 'CAI — Liste organisations',            'group' => 'CAI', 'model' => Models\CaiListeOrganisation::class],
    'cai-negociation-accord'         => ['label' => 'CAI — Négociation accord',             'group' => 'CAI', 'model' => Models\CaiNegociationAccord::class],
    'cai-marches-caracterisation'    => ['label' => 'CAI — Caractérisation marchés',        'group' => 'CAI', 'model' => Models\CaiMarcheCaracterisation::class],
    'cai-facteurs-limitant'          => ['label' => 'CAI — Facteurs limitants',             'group' => 'CAI', 'model' => Models\CaiFacteurLimitant::class],
    'cai-etude-marche'               => ['label' => 'CAI — Étude marché',                   'group' => 'CAI', 'model' => Models\CaiEtudeMarche::class],
    'cai-agroecologie-producteurs'   => ['label' => 'CAI — Agroécologie producteurs',       'group' => 'CAI', 'model' => Models\CaiAgroecologieProducteur::class],
    'cai-appui-marche'               => ['label' => 'CAI — Appui marché',                   'group' => 'CAI', 'model' => Models\CaiAppuiMarche::class],
    'cai-programmation-marche'       => ['label' => 'CAI — Programmation marché',           'group' => 'CAI', 'model' => Models\CaiProgrammationMarche::class],
    'cai-programme-quinzaine'        => ['label' => 'CAI — Programme quinzaine',            'group' => 'CAI', 'model' => Models\CaiProgrammeQuinzaine::class],
    'cai-journal-caisse'             => ['label' => 'CAI — Journal caisse',                 'group' => 'CAI', 'model' => Models\CaiJournalCaisse::class],
    'cai-fiche-stock'                => ['label' => 'CAI — Fiche stock',                    'group' => 'CAI', 'model' => Models\CaiFicheStock::class],
    'cai-evolution-rendements-cep'   => ['label' => 'CAI — Évolution rendements CEP',       'group' => 'CAI', 'model' => Models\CaiEvolutionRendementsCep::class],
    'cai-evolution-rendements-ud'    => ['label' => 'CAI — Évolution rendements UD',        'group' => 'CAI', 'model' => Models\CaiEvolutionRendementsUd::class],
    'cai-evolution-produits-chimiques' => ['label' => 'CAI — Évolution produits chimiques', 'group' => 'CAI', 'model' => Models\CaiEvolutionProduitsChimiques::class],
    'cai-evolution-produits-organiques' => ['label' => 'CAI — Évolution produits organiques', 'group' => 'CAI', 'model' => Models\CaiEvolutionProduitsOrganiques::class],
    'cai-evolution-especes'          => ['label' => 'CAI — Évolution espèces',              'group' => 'CAI', 'model' => Models\CaiEvolutionEspeces::class],
    'cai-analyse-qualite-sols'       => ['label' => 'CAI — Analyse qualité sols',           'group' => 'CAI', 'model' => Models\CaiAnalyseQualiteSols::class],
    'cai-cout-transaction'           => ['label' => 'CAI — Coût transaction',               'group' => 'CAI', 'model' => Models\CaiCoutTransaction::class],
    'cai-evaluation-institutionnelle' => ['label' => 'CAI — Évaluation institutionnelle',   'group' => 'CAI', 'model' => Models\CaiEvaluationInstitutionnelle::class],
    'cai-evaluation-organisationnelle' => ['label' => 'CAI — Évaluation organisationnelle', 'group' => 'CAI', 'model' => Models\CaiEvaluationOrganisationnelle::class],
    'cai-evaluation-sociale'         => ['label' => 'CAI — Évaluation sociale',             'group' => 'CAI', 'model' => Models\CaiEvaluationSociale::class],

];

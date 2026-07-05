<?php

namespace App\Http\Controllers;

use App\Models\Arrondissement;
use App\Models\Cep;
use App\Models\Commune;
use App\Models\Departement;
use App\Models\ProfilHistorique;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Border;
use OpenSpout\Common\Entity\Style\BorderName;
use OpenSpout\Common\Entity\Style\BorderPart;
use OpenSpout\Common\Entity\Style\BorderStyle;
use OpenSpout\Common\Entity\Style\BorderWidth;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\CellVerticalAlignment;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\AutoFilter;
use OpenSpout\Writer\Common\Entity\Sheet;
use OpenSpout\Writer\CSV\Options as CsvOptions;
use OpenSpout\Writer\CSV\Writer as CsvWriter;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Options as XlsxOptions;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;

class DataExportController extends Controller
{
    /**
     * Colonnes sensibles jamais incluses dans un export, quel que soit le modèle.
     */
    private const EXCLUDED_COLUMNS = [
        'password', 'remember_token',
        'two_factor_secret', 'two_factor_recovery_codes',
    ];

    /**
     * Clés étrangères résolues en valeur lisible (plutôt que l'identifiant brut).
     */
    private const FK_RESOLVERS = [
        'user_id'           => ['model' => User::class,           'attribute' => 'name',    'label' => 'Conseiller'],
        'commune_id'        => ['model' => Commune::class,        'attribute' => 'nom',     'label' => 'Commune'],
        'departement_id'    => ['model' => Departement::class,    'attribute' => 'nom',     'label' => 'Département'],
        'arrondissement_id' => ['model' => Arrondissement::class, 'attribute' => 'nom',     'label' => 'Arrondissement'],
        'cep_id'            => ['model' => Cep::class,            'attribute' => 'nom_cep', 'label' => 'CEP'],
        'profil_historique_id' => ['model' => ProfilHistorique::class, 'attribute' => 'village', 'label' => 'Profil historique (village)'],
    ];

    /**
     * Relations à précharger (évite le N+1) pour les jeux de données dont l'export
     * ajoute une colonne calculée à partir d'une relation hasMany/hasOne.
     */
    private const EAGER_LOADS = [
        'cep' => ['membres.participant'],
    ];

    /**
     * Colonnes contenant une liste "une entrée par ligne" (membres d'un CEP, domaines
     * hiérarchisés…) : elles doivent rester plus larges pour qu'un intitulé long ne se
     * replie jamais à l'intérieur d'une même entrée, ce qui désynchroniserait sa ligne
     * par rapport aux colonnes voisines (ex : Score, Rang).
     */
    private const WIDE_LIST_COLUMNS = [
        'membres', 'domaine_activite', 'domaine_speculation',
        'objectifs_visite', 'ce_qui_a_marche', 'ce_qui_doit_etre_ameliore',
        'experimentations_tests', 'qui_sont_visiteurs',
        'responsables', 'tendances_marches', 'situation_exploitation', 'ecarts_combler',
        'produits_agricoles', 'attentes', 'attente', 'pratiques', 'produits',
    ];

    /**
     * Colonnes générées en lockstep (même boucle, même nombre de lignes) : dans le PDF,
     * elles ne doivent jamais se replier automatiquement, sous peine de désynchronisation.
     */
    private const SYNCED_LIST_COLUMNS = [
        'membres', 'domaine_activite', 'domaine_speculation', 'score', 'rang',
        'objectifs_visite', 'ce_qui_a_marche', 'ce_qui_doit_etre_ameliore',
        'experimentations_tests', 'qui_sont_visiteurs',
        'responsables', 'tendances_marches', 'situation_exploitation', 'ecarts_combler',
        'produits_agricoles', 'attentes', 'attente', 'pratiques', 'produits',
    ];

    /**
     * Colonnes à valeur scalaire courte (ex : une année sur 4 chiffres) qui ne
     * doivent jamais se couper en plein milieu dans le PDF.
     */
    private const SHORT_VALUE_COLUMNS = ['annee'];

    /**
     * Colonnes de contexte placées en tête de fichier : elles identifient la ligne
     * (qui, où, quel CEP) et servent de clés de regroupement dans une analyse
     * statistique (tableaux croisés dynamiques, jointures entre fiches…).
     */
    private const LEADING_COLUMNS = [
        'id', 'user_id', 'departement_id', 'commune_id', 'arrondissement_id',
        'village', 'cep_id', 'profil_historique_id',
    ];

    /**
     * Colonnes techniques rejetées en fin de fichier (métadonnées d'audit).
     */
    private const TRAILING_COLUMNS = ['created_at', 'updated_at', 'deleted_at'];

    /**
     * Domaines fixes du formulaire de hiérarchisation (même ordre que dans
     * l'écran de saisie) — toujours présents dans l'export « Par village »,
     * même sans score renseigné pour un village donné.
     */
    private const DOMAINES_ACTIVITE_ORDER = [
        'Agriculture', 'Elevage', 'Foresterie', 'Artisanat',
        'Transport', 'Transformation', 'Pêche',
    ];

    /**
     * Couleur du bandeau et des libellés secondaires (bleu) du gabarit à
     * en-tête double ligne du Bilan mensuel des sessions d'animation du CEP.
     */
    private const BILAN_SESSIONS_BAND_BG   = 'F8CBAD';
    private const BILAN_SESSIONS_SUB_COLOR = '1155CC';

    /**
     * Position de chaque colonne « données métier » dans l'en-tête à double
     * ligne du Bilan mensuel des sessions d'animation du CEP : regroupement
     * (colonne fusionnée sur la ligne 1) et libellé propre au gabarit papier.
     * Une colonne absente de cette table (contexte, audit) reste affichée en
     * simple en-tête sur deux lignes fusionnées verticalement.
     */
    private const BILAN_SESSIONS_LAYOUT = [
        'date_session'           => ['group' => null, 'label' => 'Dates des sessions'],
        'participation_total'    => ['group' => 'Participation des apprenants', 'label' => 'Total', 'color' => self::BILAN_SESSIONS_SUB_COLOR],
        'participation_h'        => ['group' => 'Participation des apprenants', 'label' => 'H', 'color' => self::BILAN_SESSIONS_SUB_COLOR],
        'participation_f_jeunes' => ['group' => 'Participation des apprenants', 'label' => 'F et Jeunes', 'color' => self::BILAN_SESSIONS_SUB_COLOR],
        'nb_aaes'                => ['group' => null, 'label' => 'Nb. AAES', 'color' => self::BILAN_SESSIONS_SUB_COLOR],
        'nb_test_urne'           => ['group' => null, 'label' => "Nb. test d'urne", 'color' => self::BILAN_SESSIONS_SUB_COLOR],
        'sujets_speciaux'        => ['group' => null, 'label' => 'Sujets spéciaux animés', 'color' => self::BILAN_SESSIONS_SUB_COLOR],
        'visiteur_nom'           => ['group' => 'Visiteurs ou personnes ressources', 'label' => 'Nom'],
        'visiteur_structure'     => ['group' => 'Visiteurs ou personnes ressources', 'label' => 'Structure'],
    ];

    /**
     * Couleur de bandeau partagée par les fiches "activités CEP" à gabarit
     * papier (visites d'échanges, rendements) — reprise de leur aperçu.
     */
    private const VISITES_RENDEMENTS_BAND_BG = 'F4B942';

    private const ORGANISATION_VISITES_LAYOUT = [
        'date'                      => ['group' => null, 'label' => 'Date'],
        'lieu_visite'               => ['group' => null, 'label' => 'Lieu visité'],
        'participants_total'        => ['group' => null, 'label' => 'Total'],
        'participants_hommes'       => ['group' => null, 'label' => 'H'],
        'participants_femmes'       => ['group' => null, 'label' => 'F'],
        'participants_jeunes'       => ['group' => null, 'label' => 'J'],
        'objectifs_visite'          => ['group' => null, 'label' => 'Objectifs de la visite'],
        'ce_qui_a_marche'           => ['group' => null, 'label' => 'Ce qui a marché'],
        'ce_qui_doit_etre_ameliore' => ['group' => null, 'label' => 'Ce qui doit être amélioré'],
    ];

    private const VISITES_COMMENTEES_LAYOUT = [
        'date'                      => ['group' => null, 'label' => 'Date'],
        'experimentations_tests'    => ['group' => null, 'label' => 'Expérimentations (tests)'],
        'visiteurs_total'           => ['group' => 'Visiteurs', 'label' => 'Total'],
        'visiteurs_hommes'          => ['group' => 'Visiteurs', 'label' => 'Hommes'],
        'visiteurs_femmes'          => ['group' => 'Visiteurs', 'label' => 'Femmes'],
        'visiteurs_jeunes'          => ['group' => 'Visiteurs', 'label' => 'Jeunes'],
        'qui_sont_visiteurs'        => ['group' => null, 'label' => 'Qui sont les visiteurs'],
        'ce_qui_a_marche'           => ['group' => null, 'label' => 'Ce qui a marché'],
        'ce_qui_doit_etre_ameliore' => ['group' => null, 'label' => 'Ce qui doit être amélioré'],
    ];

    private const EVOLUTION_RENDEMENTS_LAYOUT = [
        'commune_id'                => ['group' => null, 'label' => 'Commune'],
        'arrondissement_id'         => ['group' => null, 'label' => 'Arrondissement'],
        'village'                   => ['group' => null, 'label' => 'Village'],
        'type_experimentation_cep'  => ['group' => null, 'label' => "Type d'expérimentation CEP"],
        'culture'                   => ['group' => null, 'label' => 'Culture'],
        'technologies_dispositif_1' => ['group' => 'Technologies dispositif', 'group_bg' => 'E2F0E2', 'label' => '1'],
        'technologies_dispositif_2' => ['group' => 'Technologies dispositif', 'group_bg' => 'E2F0E2', 'label' => '2'],
        'technologies_dispositif_3' => ['group' => 'Technologies dispositif', 'group_bg' => 'E2F0E2', 'label' => '3'],
        'technologies_dispositif_4' => ['group' => 'Technologies dispositif', 'group_bg' => 'E2F0E2', 'label' => '4'],
        'rendement_dispositif_1'    => ['group' => 'Rendement dispositif', 'group_bg' => 'FFFBEB', 'label' => '1'],
        'rendement_dispositif_2'    => ['group' => 'Rendement dispositif', 'group_bg' => 'FFFBEB', 'label' => '2'],
        'rendement_dispositif_3'    => ['group' => 'Rendement dispositif', 'group_bg' => 'FFFBEB', 'label' => '3'],
        'rendement_dispositif_4'    => ['group' => 'Rendement dispositif', 'group_bg' => 'FFFBEB', 'label' => '4'],
    ];

    private const RENDEMENT_DISPOSITIF_LAYOUT = [
        'commune_id'          => ['group' => null, 'label' => 'Commune'],
        'arrondissement_id'   => ['group' => null, 'label' => 'Arrondissement'],
        'village'             => ['group' => null, 'label' => 'Village'],
        'nom_producteur'      => ['group' => null, 'label' => "Nom et prénoms du Producteur porteur de l'UD"],
        'culture_technologie' => ['group' => null, 'label' => 'Culture / Technologie'],
        'rendement_annee_n1'             => ['group' => 'Rendement UD', 'group_bg' => 'D4E8D4', 'label' => 'Année n-1'],
        'rendement_annee_n_technologie'  => ['group' => 'Rendement UD', 'group_bg' => 'D4E8D4', 'label' => 'Année n avec technologie'],
        'rendement_annee_n_temoin'       => ['group' => 'Rendement UD', 'group_bg' => 'D4E8D4', 'label' => 'Année n parcelle témoin'],
    ];

    /**
     * Grille de la fiche "Évolution produits organiques" : en-tête vert clair
     * (comme son aperçu), colonnes Qté/Montant regroupées par année.
     */
    private const PRODUITS_ORGANIQUES_LAYOUT = [
        'commune'           => ['group' => null, 'label' => 'Commune',      'bg' => 'DCFCE7', 'color' => '14532D'],
        'conseiller'        => ['group' => null, 'label' => 'Conseiller',   'bg' => 'DCFCE7', 'color' => '14532D'],
        'arrondissement'    => ['group' => null, 'label' => 'Arrondissement', 'bg' => 'DCFCE7', 'color' => '14532D'],
        'village'           => ['group' => null, 'label' => 'Village',      'bg' => 'DCFCE7', 'color' => '14532D'],
        'nom_producteur'    => ['group' => null, 'label' => 'Nom et prénoms', 'bg' => 'DCFCE7', 'color' => '14532D'],
        'categorie_intrant' => ['group' => null, 'label' => "Catégories d'intrants", 'bg' => 'DCFCE7', 'color' => '14532D'],
        'qte_n1'            => ['group' => 'Année n-1', 'group_bg' => 'DCFCE7', 'color' => '14532D', 'label' => 'Qté (L)'],
        'montant_n1'        => ['group' => 'Année n-1', 'group_bg' => 'DCFCE7', 'color' => '14532D', 'label' => 'Montant (FCFA)'],
        'qte_n'             => ['group' => 'Année n', 'group_bg' => 'DCFCE7', 'color' => '14532D', 'label' => 'Qté (L)'],
        'montant_n'         => ['group' => 'Année n', 'group_bg' => 'DCFCE7', 'color' => '14532D', 'label' => 'Montant (FCFA)'],
        'qte_n_plus1'       => ['group' => 'Année n+1', 'group_bg' => 'DCFCE7', 'color' => '14532D', 'label' => 'Qté (L)'],
        'montant_n_plus1'   => ['group' => 'Année n+1', 'group_bg' => 'DCFCE7', 'color' => '14532D', 'label' => 'Montant (FCFA)'],
        'observations'      => ['group' => null, 'label' => 'Observation', 'bg' => 'DCFCE7', 'color' => '14532D'],
    ];

    /**
     * Grille du Journal de caisse : Entrées (vert) / Sorties (rouge) regroupées
     * sous une même bannière "Trésorerie", solde cumulé en bleu — comme son aperçu.
     */
    private const JOURNAL_CAISSE_LAYOUT = [
        'commune'             => ['group' => null, 'label' => 'Commune'],
        'conseiller'          => ['group' => null, 'label' => 'Conseiller'],
        'date'                => ['group' => null, 'label' => 'Date'],
        'produit'             => ['group' => null, 'label' => 'Produit'],
        'operations'          => ['group' => null, 'label' => 'Opérations (ventes, achats et autres)'],
        'encaissements'          => ['group' => 'Trésorerie — Entrées', 'group_bg' => 'DCFCE7', 'color' => '166534', 'label' => 'Encaissements'],
        'encaissements_excep'    => ['group' => 'Trésorerie — Entrées', 'group_bg' => 'DCFCE7', 'color' => '166534', 'label' => 'Encaissements exceptionnels'],
        'decaissements'          => ['group' => 'Trésorerie — Sorties', 'group_bg' => 'FEE2E2', 'color' => '991B1B', 'label' => 'Décaissements'],
        'decaissements_excep'    => ['group' => 'Trésorerie — Sorties', 'group_bg' => 'FEE2E2', 'color' => '991B1B', 'label' => 'Décaissements exceptionnelles'],
        'solde'               => ['group' => null, 'label' => 'Solde / Reste', 'bg' => 'DBEAFE', 'color' => '1D4ED8'],
    ];

    /**
     * Grille de la Fiche de stock : Entrées (vert) / Sorties (rouge), stock
     * cumulé en bleu — comme son aperçu.
     */
    private const FICHE_STOCK_LAYOUT = [
        'commune'             => ['group' => null, 'label' => 'Commune'],
        'conseiller'          => ['group' => null, 'label' => 'Conseiller'],
        'date_mvt'            => ['group' => null, 'label' => 'Date des mouvements'],
        'entree_qte'          => ['group' => 'Entrées', 'group_bg' => 'DCFCE7', 'color' => '166534', 'label' => 'Qté'],
        'entree_pu'           => ['group' => 'Entrées', 'group_bg' => 'DCFCE7', 'color' => '166534', 'label' => 'P.U'],
        'entree_montant'      => ['group' => 'Entrées', 'group_bg' => 'DCFCE7', 'color' => '166534', 'label' => 'Montant FCFA'],
        'entree_provenance'   => ['group' => 'Entrées', 'group_bg' => 'DCFCE7', 'color' => '166534', 'label' => 'Provenance (parcelles)'],
        'sortie_qte'          => ['group' => 'Sorties', 'group_bg' => 'FEE2E2', 'color' => '991B1B', 'label' => 'Qté'],
        'sortie_montant'      => ['group' => 'Sorties', 'group_bg' => 'FEE2E2', 'color' => '991B1B', 'label' => 'Montant FCFA'],
        'sortie_destination'  => ['group' => 'Sorties', 'group_bg' => 'FEE2E2', 'color' => '991B1B', 'label' => 'Client/destination'],
        'stock'               => ['group' => null, 'label' => 'Stock (Qté)', 'bg' => 'DBEAFE', 'color' => '1D4ED8'],
        'observations'        => ['group' => null, 'label' => 'Observations'],
    ];

    /**
     * Colonnes JSON "liste d'entrées" (objectifs, constats…) affichées comme le
     * fait déjà l'export CEP pour "Membres" : une seule colonne, une entrée par
     * ligne préfixée d'un tiret — plutôt qu'éclatées en plusieurs colonnes.
     */
    private const JOINED_LIST_COLUMNS = [
        'objectifs_visite', 'ce_qui_a_marche', 'ce_qui_doit_etre_ameliore',
        'experimentations_tests', 'qui_sont_visiteurs',
        'responsables', 'tendances_marches', 'situation_exploitation', 'ecarts_combler',
        'produits_agricoles', 'attentes', 'attente', 'pratiques', 'produits',
    ];

    /**
     * Colonnes texte riche (HTML saisi via un éditeur WYSIWYG, ex : la
     * matrice FFOM) affichées en texte à puces plutôt qu'en balises brutes.
     */
    private const HTML_BULLET_COLUMNS = ['forces', 'faiblesses', 'opportunites', 'menaces'];

    /**
     * Libellés lisibles pour les colonnes techniques communes à plusieurs modèles.
     */
    private const COLUMN_LABELS = [
        'id'                 => 'ID',
        'created_at'         => 'Créé le',
        'updated_at'         => 'Modifié le',
        'deleted_at'         => 'Supprimé le',
        'email_verified_at'  => 'Email vérifié le',
        'name'               => 'Nom',
        'email'              => 'Email',
        'telephone'          => 'Téléphone',
        'is_blocked'         => 'Bloqué',
        'is_suspended'       => 'Suspendu',
        'is_frozen'          => 'Gelé',
        'blocked_at'         => 'Bloqué le',
        'suspended_at'       => 'Suspendu le',
        'frozen_at'          => 'Gelé le',
        'blocked_reason'     => 'Motif de blocage',
        'suspended_reason'   => 'Motif de suspension',
        'frozen_reason'      => 'Motif de gel',
        'donnees'            => 'Détails',
        'nom_cep'            => 'Nom du CEP',
        'nom_prenom'         => 'Nom et prénom',
        'domaine_activite'   => "Domaine d'activité",
        'domaine_speculation' => 'Domaine / Spéculation',
        'autre_precision'    => 'Autre précision',
        'est_pertinent'      => 'Pertinent',
        'membres'            => 'Membres',
        'annee'              => 'Année',
        'evenements'         => 'Événements',
        'impact'             => 'Impact (changements induits)',
        'date_session'       => 'Date de session',
        'participation_total' => 'Participation — Total',
        'participation_h'    => 'Participation — Hommes',
        'participation_f_jeunes' => 'Participation — Femmes et jeunes',
        'nb_aaes'            => 'Nb. AAES',
        'nb_test_urne'       => "Nb. test d'urne",
        'sujets_speciaux'    => 'Sujets spéciaux animés',
        'visiteur_nom'       => 'Visiteur — Nom',
        'visiteur_structure' => 'Visiteur — Structure',
        'lieu_visite'            => 'Lieu visité',
        'participants_total'     => 'Participants — Total',
        'participants_hommes'    => 'Participants — Hommes',
        'participants_femmes'    => 'Participants — Femmes',
        'participants_jeunes'    => 'Participants — Jeunes',
        'objectifs_visite'          => 'Objectifs de la visite',
        'ce_qui_a_marche'           => 'Ce qui a marché',
        'ce_qui_doit_etre_ameliore' => 'Ce qui doit être amélioré',
        'experimentations_tests' => 'Expérimentations (tests)',
        'visiteurs_total'        => 'Visiteurs — Total',
        'visiteurs_hommes'       => 'Visiteurs — Hommes',
        'visiteurs_femmes'       => 'Visiteurs — Femmes',
        'visiteurs_jeunes'       => 'Visiteurs — Jeunes',
        'qui_sont_visiteurs'     => 'Qui sont les visiteurs',
        'type_experimentation_cep'   => "Type d'expérimentation CEP",
        'culture'                    => 'Culture',
        'technologies_dispositif_1'  => 'Technologies dispositif — 1',
        'technologies_dispositif_2'  => 'Technologies dispositif — 2',
        'technologies_dispositif_3'  => 'Technologies dispositif — 3',
        'technologies_dispositif_4'  => 'Technologies dispositif — 4',
        'rendement_dispositif_1'     => 'Rendement dispositif — 1',
        'rendement_dispositif_2'     => 'Rendement dispositif — 2',
        'rendement_dispositif_3'     => 'Rendement dispositif — 3',
        'rendement_dispositif_4'     => 'Rendement dispositif — 4',
        'culture_technologie'           => 'Culture / Technologie',
        'rendement_annee_n1'             => 'Rendement — Année n-1',
        'rendement_annee_n_technologie'  => 'Rendement — Année n avec technologie',
        'rendement_annee_n_temoin'       => 'Rendement — Année n parcelle témoin',
        'commune'    => 'Commune',
        'conseiller' => 'Conseiller',
        'section'    => 'Section',
        'type_experimentation' => "Type d'expérimentation CEP",
        'rendement_d1' => 'Rendement Dispositif 1',
        'rendement_d2' => 'Rendement Dispositif 2',
        'rendement_d3' => 'Rendement Dispositif 3',
        'rendement_d4' => 'Rendement Dispositif 4',
        'rendement_n1'             => 'Rendement — Année n-1',
        'rendement_n_technologie'  => 'Rendement — Année n avec technologie',
        'rendement_n_temoin'       => 'Rendement — Année n parcelle témoin',
        'periode'      => 'Période de réalisation',
        'activites'    => 'Activités réalisées dans la zone',
        'zone'         => 'Zone concernée',
        'groupe_cible' => 'Groupe cible et lieu',
        'acteurs'      => 'Acteurs Responsables',
        'appuis'       => 'Appuis sollicités (Types de mise en œuvre)',
        'moyens'       => 'Moyens de mise en œuvre',
        'indicateurs'  => "Indicateurs de suivi de l'appui",
        'categorie_pesticide' => 'Catégorie de pesticides chimiques',
        'qte_n2'       => 'Qté utilisée (L) en année n-2',
        'qte_n1'       => 'Qté utilisée (L) en année n-1',
        'qte_n'        => 'Qté utilisée (L) en année n',
        'observations' => 'Observation',
        'categorie_intrant' => "Catégorie d'intrant",
        'montant_n1'     => 'Montant n-1 (FCFA)',
        'montant_n'      => 'Montant n (FCFA)',
        'qte_n_plus1'    => 'Qté n+1 (L)',
        'montant_n_plus1' => 'Montant n+1 (FCFA)',
        'especes'          => 'Espèces',
        'identite_espece'  => "Identité de l'espèce",
        'nb_n1'            => 'Nb individus n-1',
        'nb_n'             => 'Nb individus n',
        'nb_n_plus1'       => 'Nb individus n+1',
        'date'         => 'Date',
        'produit'      => 'Produit',
        'operations'   => 'Opérations',
        'encaissements'       => 'Encaissements',
        'encaissements_excep' => 'Encaissements exceptionnels',
        'decaissements'       => 'Décaissements',
        'decaissements_excep' => 'Décaissements exceptionnels',
        'solde'        => 'Solde / Reste',
        'date_mvt'          => 'Date des mouvements',
        'entree_qte'        => 'Entrée — Qté',
        'entree_pu'         => 'Entrée — P.U',
        'entree_montant'    => 'Entrée — Montant FCFA',
        'entree_provenance' => 'Entrée — Provenance (parcelles)',
        'sortie_qte'        => 'Sortie — Qté',
        'sortie_montant'    => 'Sortie — Montant FCFA',
        'sortie_destination' => 'Sortie — Client/destination',
        'stock'             => 'Stock (Qté)',
        'marche'      => 'Marché',
        'pretransformation'          => 'Pré-transformation',
        'pre_transformation'         => 'Pré-transformation',
        'transport'                  => 'Transport',
        'emballage'                  => 'Emballage',
        'entreposage'                => 'Entreposage',
        'produits_conservation'      => 'Produits de conservation',
        'interets_commercialisation' => 'Intérêts financiers (commercialisation)',
        'amortissement'              => 'Amortissement',
        'interets_investissement'    => "Intérêts financiers (investissement)",
        'inspection_conseil'         => 'Inspection des produits/conseil',
        'taxes_marche'               => 'Taxes de marché',
        'intermediaires'             => 'Intermédiaires',
        'promotion_publicite'        => 'Promotion/publicité',
        'pertes'                     => 'Pertes',
        'produit_brut'               => 'Produit brut (FCFA)',
        'charges_totales'            => 'Charges totales (FCFA)',
        'marge_brute'                => 'Marge brute (FCFA)',
        'marge_nette'                => 'Marge nette (FCFA)',
        'prix_kg'                    => 'Prix du Kg (FCFA)',
        'cout_transaction'           => 'Coût de transaction (FCFA)',
        'operation' => 'Opération',
        'mois'      => 'Mois',
        'decade'    => 'Décade',
        'valeur'    => 'Valeur',
        'critere'      => 'Critère',
        'indicateur'   => 'Indicateur',
        'score'        => 'Score',
        'observation'  => 'Observation',
        'justification' => 'Justification',
        'precision'    => 'Précision',
        'numero'                => 'N°',
        'contraintes_a_lever'   => 'Contraintes à lever',
        'moyens_conseiller'     => 'Moyens — Conseiller',
        'moyens_op_exploitation' => 'Moyens — OP/Exploitation',
        'periode_debut'         => 'Période — Début',
        'periode_fin'           => 'Période — Fin',
        'periode_execution'     => "Période d'exécution",
        'pratiques'    => 'Pratiques agroécologiques',
        'nom_op'       => "Nom de l'OP",
        'siege_contact' => 'Siège/Contact',
        'numero_groupement' => 'N° groupement',
        'effectif_h'   => 'Effectifs membres — H',
        'effectif_f'   => 'Effectifs membres — F',
        'op_appartenance' => "OP d'appartenance",
        'mode_commercialisation' => 'Mode de commercialisation',
        'marche_actuel' => 'Marché actuel',
    ];

    /**
     * Liste des jeux de données exportables, groupés pour l'UI.
     */
    public function datasets()
    {
        $datasets = collect(config('exportable_datasets'))
            ->map(fn ($dataset, $key) => [
                'key'   => $key,
                'label' => $dataset['label'],
                'group' => $dataset['group'],
            ])
            ->values()
            ->groupBy('group');

        return response()->json($datasets);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'type'      => ['required', 'string', Rule::in(array_keys(config('exportable_datasets')))],
            'format'    => ['required', 'string', 'in:csv,xlsx,pdf'],
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date'],
        ]);

        $dataset = config('exportable_datasets.'.$validated['type']);

        [$headers, $columnLabels, $data, $blocks, $gridHeader] = $this->buildDataset(
            $validated['type'], $dataset,
            $validated['date_from'] ?? null, $validated['date_to'] ?? null,
        );

        $filename = $validated['type'].'-'.now()->format('Y-m-d_His');

        $section = [
            'type'           => $validated['type'],
            'label'          => $dataset['label'],
            'sheet'          => $dataset['sheet'] ?? $dataset['label'],
            'group'          => $dataset['group'],
            'headers'        => $headers,
            'columnLabels'   => $columnLabels,
            'data'           => $data,
            'contentColumns' => $this->contentColumnIndices($headers, $dataset),
            'blocks'         => $blocks,
            'gridHeader'     => $gridHeader,
        ];

        return match ($validated['format']) {
            'csv'  => $this->exportCsv($columnLabels, $data, $filename),
            'xlsx' => $this->exportGroupXlsx([$section], $filename),
            'pdf'  => $this->exportGroupPdf($dataset['label'], [$section], $filename),
        };
    }

    /**
     * Export groupé « par module » : toutes les fiches d'un groupe de la barre
     * latérale dans un seul fichier — classeur XLSX multi-feuilles, archive ZIP
     * de CSV, ou PDF multi-sections.
     */
    public function exportGroup(Request $request)
    {
        $datasets = collect(config('exportable_datasets'));

        $validated = $request->validate([
            'group'     => ['required', 'string', Rule::in($datasets->pluck('group')->unique()->all())],
            'format'    => ['required', 'string', 'in:csv,xlsx,pdf'],
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date'],
        ]);

        $sections = [];
        foreach ($datasets as $type => $dataset) {
            if ($dataset['group'] !== $validated['group']) {
                continue;
            }

            [$headers, $columnLabels, $data, $blocks, $gridHeader] = $this->buildDataset(
                $type, $dataset,
                $validated['date_from'] ?? null, $validated['date_to'] ?? null,
            );

            $sections[] = [
                'type'           => $type,
                'label'          => $dataset['label'],
                'sheet'          => $dataset['sheet'] ?? $dataset['label'],
                'group'          => $dataset['group'],
                'headers'        => $headers,
                'columnLabels'   => $columnLabels,
                'data'           => $data,
                'contentColumns' => $this->contentColumnIndices($headers, $dataset),
                'blocks'         => $blocks,
                'gridHeader'     => $gridHeader,
            ];
        }

        $filename = Str::slug($validated['group']).'-'.now()->format('Y-m-d_His');

        return match ($validated['format']) {
            'csv'  => $this->exportGroupCsv($sections, $filename),
            'xlsx' => $this->exportGroupXlsx($sections, $filename),
            'pdf'  => $this->exportGroupPdf($validated['group'], $sections, $filename),
        };
    }

    /**
     * Charge et met en forme un jeu de données : lignes filtrées par période,
     * clés étrangères résolues, colonnes aplaties et libellés lisibles. Un
     * jeu de données « blocks » (ex : domaines — par village) fournit en plus
     * une grille par village pour le rendu visuel XLSX/PDF.
     *
     * @return array{0: array<int, string>, 1: array<int, string>, 2: array<int, array<int, string>>, 3: ?array}
     */
    private function buildDataset(string $type, array $dataset, ?string $dateFrom, ?string $dateTo): array
    {
        $modelClass = $dataset['model'];
        $model      = new $modelClass();
        $table      = $model->getTable();
        $hasDates   = Schema::hasColumn($table, 'created_at');

        $query = $modelClass::query()->with(self::EAGER_LOADS[$type] ?? []);
        if ($hasDates && $dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($hasDates && $dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $rows = $query->orderBy($model->getKeyName())->get();

        $fkMaps = $this->resolveForeignKeys($rows, $table);

        $blocks = null;
        if (isset($dataset['blocks'])) {
            $groups = $this->groupDomainesByVillage($rows, $fkMaps);
            [$headers, $data] = $this->domainesTidyRows($groups);
            $blocks = $this->domainesBlocks($groups, $dataset['band_label'] ?? $dataset['label']);
        } elseif (isset($dataset['pivot'])) {
            [$headers, $data] = $this->pivotByVillage($rows, $fkMaps, $dataset['pivot']);
        } elseif (isset($dataset['json_rows'])) {
            [$headers, $data] = $this->expandJsonRows($rows, $fkMaps, $dataset['json_rows']);
            if (isset($dataset['json_rows_total'])) {
                $data = $this->appendTotalRows(
                    $headers, $data,
                    $dataset['json_rows_total'],
                    $dataset['json_rows_total_label'] ?? 'Total',
                    $dataset['json_rows_total_group'] ?? null,
                );
            }
        } elseif (isset($dataset['ledger'])) {
            $ledger = $dataset['ledger'];
            [$headers, $data] = $this->expandLedgerRows(
                $rows, $fkMaps,
                $ledger['report_path'], $ledger['entree_keys'], $ledger['sortie_keys'], $ledger['balance_key'],
                $ledger['trailing_keys'] ?? [],
            );
        } elseif (isset($dataset['keyed_rows'])) {
            $kr = $dataset['keyed_rows'];
            [$headers, $data] = $this->expandKeyedRows($rows, $fkMaps, $kr['path'], $kr['entity_label'], $kr['key_labels'] ?? []);
            if (isset($dataset['computed_columns'])) {
                [$headers, $data] = $this->appendComputedColumns($headers, $data, $dataset['computed_columns']);
            }
        } elseif (isset($dataset['flat_matrix'])) {
            $fm = $dataset['flat_matrix'];
            [$headers, $data] = $this->expandFlatMatrixRows($rows, $fkMaps, $fm);
        } else {
            [$headers, $data] = $this->flatten($rows, $table, $fkMaps, $type);
        }

        if (($dataset['periode_columns'] ?? null) !== null) {
            $pc = $dataset['periode_columns'];
            if (isset($pc['reorder'])) {
                [$headers, $data] = $this->reorderColumns($headers, $data, $pc['reorder']);
            }
            [$headers, $data] = $this->computePeriodeColumn($headers, $data, $pc['debut'], $pc['fin'], $pc['target'], $pc['before']);
        }

        $gridHeader = null;
        switch ($dataset['grid_header'] ?? null) {
            case 'bilan_sessions':
                [$headers, $data] = $this->mergeColumns($headers, $data, 'participation_f', 'participation_jeunes', 'participation_f_jeunes');
                $gridHeader = [
                    'band_bg' => self::BILAN_SESSIONS_BAND_BG,
                    'rows'    => $this->buildGridHeaderRows($headers, self::BILAN_SESSIONS_LAYOUT),
                ];

                break;

            case 'organisation_visites':
                [$headers, $data] = $this->reorderColumns($headers, $data, array_keys(self::ORGANISATION_VISITES_LAYOUT));
                [$headers, $data] = $this->computeTotalColumn($headers, $data, 'participants_total', ['participants_hommes', 'participants_femmes'], 'participants_hommes');
                $gridHeader = [
                    'band_bg' => self::VISITES_RENDEMENTS_BAND_BG,
                    'rows'    => $this->buildGridHeaderRows($headers, self::ORGANISATION_VISITES_LAYOUT),
                ];

                break;

            case 'visites_commentees':
                [$headers, $data] = $this->reorderColumns($headers, $data, array_keys(self::VISITES_COMMENTEES_LAYOUT));
                [$headers, $data] = $this->computeTotalColumn($headers, $data, 'visiteurs_total', ['visiteurs_hommes', 'visiteurs_femmes'], 'visiteurs_hommes');
                $gridHeader = [
                    'band_bg' => self::VISITES_RENDEMENTS_BAND_BG,
                    'rows'    => $this->buildGridHeaderRows($headers, self::VISITES_COMMENTEES_LAYOUT),
                ];

                break;

            case 'evolution_rendements':
                [$headers, $data] = $this->reorderColumns($headers, $data, array_keys(self::EVOLUTION_RENDEMENTS_LAYOUT));
                $gridHeader = [
                    'band_bg' => self::VISITES_RENDEMENTS_BAND_BG,
                    'rows'    => $this->buildGridHeaderRows($headers, self::EVOLUTION_RENDEMENTS_LAYOUT),
                ];

                break;

            case 'rendement_dispositif':
                [$headers, $data] = $this->excludeColumns($headers, $data, ['beneficiaire_id']);
                [$headers, $data] = $this->reorderColumns($headers, $data, array_keys(self::RENDEMENT_DISPOSITIF_LAYOUT));
                $gridHeader = [
                    'band_bg' => self::VISITES_RENDEMENTS_BAND_BG,
                    'rows'    => $this->buildGridHeaderRows($headers, self::RENDEMENT_DISPOSITIF_LAYOUT),
                ];

                break;

            case 'cai_produits_organiques':
                $gridHeader = [
                    'band_bg' => 'DCFCE7',
                    'rows'    => $this->buildGridHeaderRows($headers, self::PRODUITS_ORGANIQUES_LAYOUT),
                ];

                break;

            case 'cai_journal_caisse':
                $gridHeader = [
                    'band_bg' => '78350F',
                    'rows'    => $this->buildGridHeaderRows($headers, self::JOURNAL_CAISSE_LAYOUT),
                ];

                break;

            case 'cai_fiche_stock':
                $gridHeader = [
                    'band_bg' => '78350F',
                    'rows'    => $this->buildGridHeaderRows($headers, self::FICHE_STOCK_LAYOUT),
                ];

                break;
        }

        $columnLabels = array_map(fn ($header) => $this->humanizeHeader($header), $headers);

        return [$headers, $columnLabels, $data, $blocks, $gridHeader];
    }

    /**
     * Fusionne deux colonnes en une seule colonne affichée (ex : "F" et
     * "Jeunes" en une colonne "F et Jeunes"), pour un gabarit d'export qui
     * regroupe visuellement deux champs distincts en base.
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function mergeColumns(array $headers, array $data, string $keyA, string $keyB, string $mergedKey): array
    {
        $indexA = array_search($keyA, $headers, true);
        $indexB = array_search($keyB, $headers, true);
        if ($indexA === false || $indexB === false) {
            return [$headers, $data];
        }

        $headers[$indexA] = $mergedKey;
        unset($headers[$indexB]);
        $headers = array_values($headers);

        $data = array_map(function ($row) use ($indexA, $indexB) {
            $a = $row[$indexA] ?? '';
            $b = $row[$indexB] ?? '';
            $row[$indexA] = trim(($a !== '' ? "F : {$a}" : '').($a !== '' && $b !== '' ? '  /  ' : '').($b !== '' ? "Jeunes : {$b}" : ''));
            unset($row[$indexB]);

            return array_values($row);
        }, $data);

        return [$headers, $data];
    }

    /**
     * Ajoute (ou remplace, si déjà stockée en base) une colonne « Total » calculée
     * en direct comme la somme de colonnes déjà aplaties — à l'identique du calcul
     * affiché dans l'aperçu de la fiche (qui ignore un éventuel total déjà stocké,
     * potentiellement obsolète face à des champs modifiés depuis).
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function computeTotalColumn(array $headers, array $data, string $targetKey, array $sourceKeys, string $insertBeforeKey): array
    {
        $sourceIndexes = [];
        foreach ($sourceKeys as $key) {
            $idx = array_search($key, $headers, true);
            if ($idx !== false) {
                $sourceIndexes[] = $idx;
            }
        }
        if ($sourceIndexes === []) {
            return [$headers, $data];
        }

        $values = array_map(function ($row) use ($sourceIndexes) {
            $sum      = 0.0;
            $hasValue = false;
            foreach ($sourceIndexes as $idx) {
                $v = trim((string) ($row[$idx] ?? ''));
                if ($v !== '') {
                    $sum     += (float) $v;
                    $hasValue = true;
                }
            }

            return $hasValue ? (string) (fmod($sum, 1.0) === 0.0 ? (int) $sum : $sum) : '';
        }, $data);

        $targetIndex = array_search($targetKey, $headers, true);

        if ($targetIndex !== false) {
            foreach ($data as $i => &$row) {
                $row[$targetIndex] = $values[$i];
            }
            unset($row);

            return [$headers, $data];
        }

        $insertIndex = array_search($insertBeforeKey, $headers, true);
        $insertIndex = $insertIndex === false ? count($headers) : $insertIndex;

        array_splice($headers, $insertIndex, 0, [$targetKey]);
        foreach ($data as $i => &$row) {
            array_splice($row, $insertIndex, 0, [$values[$i]]);
        }
        unset($row);

        return [$headers, $data];
    }

    /**
     * Réordonne les colonnes « données métier » (entre contexte et audit) selon
     * un ordre voulu — nécessaire car PostgreSQL ignore silencieusement la
     * position `->after()` d'une migration ALTER TABLE : une colonne ajoutée
     * après coup se retrouve physiquement en fin de table, dans un ordre qui ne
     * correspond plus à celui du formulaire de saisie. Les colonnes de contexte
     * et d'audit (voir LEADING/TRAILING_COLUMNS) ne sont jamais déplacées ; toute
     * colonne « métier » absente de l'ordre voulu est conservée, ajoutée à la fin.
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function reorderColumns(array $headers, array $data, array $order): array
    {
        $middleKeys    = array_values(array_diff($headers, self::LEADING_COLUMNS, self::TRAILING_COLUMNS));
        $orderedMiddle = array_values(array_intersect($order, $middleKeys));
        $orderedMiddle = array_merge($orderedMiddle, array_values(array_diff($middleKeys, $orderedMiddle)));

        $newOrder = array_merge(
            array_values(array_intersect(self::LEADING_COLUMNS, $headers)),
            $orderedMiddle,
            array_values(array_intersect(self::TRAILING_COLUMNS, $headers)),
        );

        $indexOf = array_flip($headers);
        $indexes = array_map(fn ($key) => $indexOf[$key], $newOrder);

        $newHeaders = array_map(fn ($i) => $headers[$i], $indexes);
        $newData    = array_map(fn ($row) => array_map(fn ($i) => $row[$i] ?? '', $indexes), $data);

        return [$newHeaders, $newData];
    }

    /**
     * Retire des colonnes redondantes propres à un jeu de données donné (ex :
     * une clé étrangère dont la valeur résolue est déjà présente sous forme de
     * colonnes dénormalisées) — distinct d'EXCLUDED_COLUMNS, qui s'applique
     * uniformément à tous les exports pour des raisons de sécurité.
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function excludeColumns(array $headers, array $data, array $exclude): array
    {
        $keep = array_values(array_filter(array_keys($headers), fn ($i) => ! in_array($headers[$i], $exclude, true)));

        $newHeaders = array_map(fn ($i) => $headers[$i], $keep);
        $newData    = array_map(fn ($row) => array_map(fn ($i) => $row[$i] ?? '', $keep), $data);

        return [$newHeaders, $newData];
    }

    /**
     * Construit les deux lignes d'un en-tête à colonnes fusionnées (groupes sur
     * la ligne 1, sous-libellés sur la ligne 2), à partir d'une table de mise
     * en page keyée par nom de colonne. Les colonnes absentes de la table
     * (contexte, audit) restent un simple en-tête fusionné verticalement.
     *
     * @return array{0: array<int, array{label: string, colspan: int, rowspan: int, color: ?string}>, 1: array<int, array{label: string, colspan: int, rowspan: int, color: ?string}>}
     */
    private function buildGridHeaderRows(array $headers, array $layout): array
    {
        $columnLabels = array_map(fn ($header) => $this->humanizeHeader($header), $headers);
        $n            = count($headers);

        // Un gabarit sans aucun regroupement (toutes les colonnes à plat, ex :
        // Organisation de visites d'échanges) reste un simple en-tête sur une ligne.
        $hasGroups = false;
        for ($j = 0; $j < $n; $j++) {
            if ((($layout[$headers[$j]] ?? null)['group'] ?? null) !== null) {
                $hasGroups = true;

                break;
            }
        }
        $rowSpan = $hasGroups ? 2 : 1;

        $row1 = [];
        $row2 = [];
        $i    = 0;

        while ($i < $n) {
            $spec = $layout[$headers[$i]] ?? null;

            if ($spec === null) {
                $row1[] = ['label' => $columnLabels[$i], 'colspan' => 1, 'rowspan' => $rowSpan, 'color' => null, 'bg' => null];
                $i++;

                continue;
            }

            if ($spec['group'] === null) {
                $row1[] = ['label' => $spec['label'], 'colspan' => 1, 'rowspan' => $rowSpan, 'color' => $spec['color'] ?? null, 'bg' => $spec['bg'] ?? null];
                $i++;

                continue;
            }

            $group   = $spec['group'];
            $groupBg = $spec['group_bg'] ?? null;
            $span    = 0;
            while ($i < $n && (($layout[$headers[$i]]['group'] ?? null) === $group)) {
                $sub    = $layout[$headers[$i]];
                $row2[] = ['label' => $sub['label'], 'colspan' => 1, 'rowspan' => 1, 'color' => $sub['color'] ?? null, 'bg' => $sub['bg'] ?? $groupBg];
                $span++;
                $i++;
            }
            $row1[] = ['label' => $group, 'colspan' => $span, 'rowspan' => 1, 'color' => null, 'bg' => $groupBg];
        }

        return [$row1, $row2];
    }

    /**
     * Regroupe les lignes de hiérarchisation des domaines d'activités par village
     * (profil historique), avec le libellé du village et du conseiller résolus.
     *
     * @return array<int, array{village: string, conseiller: string, entries: array<int, array{domaine: string, score: ?int, rang: ?int, autre_precision: ?string}>}>
     */
    private function groupDomainesByVillage(Collection $rows, array $fkMaps): array
    {
        $groups = [];

        foreach ($rows->groupBy('profil_historique_id') as $profilId => $group) {
            $first = $group->first();

            $groups[] = [
                'village'    => $fkMaps['profil_historique_id'][$profilId] ?? ($profilId ? "#{$profilId}" : ''),
                'conseiller' => $fkMaps['user_id'][$first->user_id] ?? '',
                'entries'    => $group->map(fn ($row) => [
                    'domaine'         => (string) ($row->domaine_activite ?? ''),
                    'score'           => $row->score,
                    'rang'            => $row->rang,
                    'autre_precision' => $row->autre_precision,
                ])->all(),
            ];
        }

        return $groups;
    }

    /**
     * Table longue "propre" (une ligne par village × domaine, tous les domaines
     * fixes toujours présents) : le format le plus exploitable pour l'analyse
     * (CSV, tableaux croisés dynamiques).
     *
     * @param array<int, array{village: string, conseiller: string, entries: array}> $groups
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function domainesTidyRows(array $groups): array
    {
        $headers = ['village', 'conseiller', 'domaine_activite', 'score', 'rang'];
        $str     = fn ($v) => $v === null ? '' : (string) $v;
        $data    = [];

        foreach ($groups as $group) {
            $byDomain = collect($group['entries'])->keyBy('domaine');

            foreach (self::DOMAINES_ACTIVITE_ORDER as $domaine) {
                $entry  = $byDomain->get($domaine);
                $data[] = [$group['village'], $group['conseiller'], $domaine, $str($entry['score'] ?? null), $str($entry['rang'] ?? null)];
            }

            foreach ($group['entries'] as $entry) {
                if ($entry['domaine'] !== 'Autre à préciser') {
                    continue;
                }
                $label  = trim('Autre à préciser'.($entry['autre_precision'] ? ' — '.$entry['autre_precision'] : ''));
                $data[] = [$group['village'], $group['conseiller'], $label, $str($entry['score']), $str($entry['rang'])];
            }
        }

        return [$headers, $data];
    }

    /**
     * Grille par village (une mini-table « Domaine d'activités / Score / Rang »
     * par village), au format du formulaire de saisie — utilisée par le rendu
     * XLSX/PDF pour un document directement lisible et imprimable.
     *
     * @param array<int, array{village: string, conseiller: string, entries: array}> $groups
     */
    private function domainesBlocks(array $groups, string $bandLabel): array
    {
        $str    = fn ($v) => $v === null ? '' : (string) $v;
        $blocks = [];

        foreach ($groups as $group) {
            $byDomain = collect($group['entries'])->keyBy('domaine');
            $rows     = [];

            foreach (self::DOMAINES_ACTIVITE_ORDER as $domaine) {
                $entry  = $byDomain->get($domaine);
                $rows[] = [$domaine, $str($entry['score'] ?? null), $str($entry['rang'] ?? null)];
            }

            foreach ($group['entries'] as $entry) {
                if ($entry['domaine'] !== 'Autre à préciser') {
                    continue;
                }
                $label  = trim('Autre à préciser'.($entry['autre_precision'] ? ' — '.$entry['autre_precision'] : ''));
                $rows[] = [$label, $str($entry['score']), $str($entry['rang'])];
            }

            $blocks[] = [
                'subtitle' => $group['village'] !== ''
                    ? "Hiérarchisation des domaines d'activités — {$group['village']}"
                    : "Hiérarchisation des domaines d'activités",
                'columns'  => ["Domaine d'activités", 'Score', 'Rang'],
                'rows'     => $rows,
            ];
        }

        return ['band' => $bandLabel, 'items' => $blocks];
    }

    /**
     * Développe un jeu de données « un blob JSON par commune » (les fiches
     * CAI dont le modèle n'a qu'une colonne `donnees` en JSON) en lignes
     * lisibles : chaque entrée du ou des tableaux ciblés devient une ligne
     * d'export, avec le contexte (commune, conseiller) reporté sur chacune —
     * bien plus exploitable qu'un unique enregistrement par commune éclaté en
     * dizaines de colonnes numérotées.
     *
     * @param array<int|string, string> $paths chemin(s) dans "donnees" vers le(s) tableau(x) de lignes ;
     *                                          clé numérique = pas de colonne "Section", clé texte = libellé de section
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function expandJsonRows(Collection $rows, array $fkMaps, array $paths): array
    {
        $multiSection = collect(array_keys($paths))->contains(fn ($k) => is_string($k));

        $entries = [];
        foreach ($rows as $row) {
            $donnees    = $row->donnees ?? [];
            $commune    = $fkMaps['commune_id'][$row->commune_id] ?? '';
            $conseiller = $fkMaps['user_id'][$row->user_id] ?? '';

            foreach ($paths as $key => $path) {
                $lignes = Arr::get($donnees, $path);
                // array_is_list() écarte les blobs qui n'ont pas la forme attendue
                // (ex : les enregistrements dont le seeder générique n'a pas encore
                // été remplacé par une vraie saisie) plutôt que de générer des
                // colonnes numériques parasites à partir de leur contenu.
                if (! is_array($lignes) || ! array_is_list($lignes)) {
                    continue;
                }

                foreach ($lignes as $ligne) {
                    if (! is_array($ligne)) {
                        continue;
                    }

                    $entry = ['commune' => $commune, 'conseiller' => $conseiller];
                    if ($multiSection) {
                        $entry['section'] = is_string($key) ? $key : '';
                    }
                    foreach ($ligne as $k => $v) {
                        $entry[$k] = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
                    }
                    $entry['created_at'] = optional($row->created_at)->toISOString() ?? '';
                    $entry['updated_at'] = optional($row->updated_at)->toISOString() ?? '';
                    $entries[] = $entry;
                }
            }
        }

        if ($entries === []) {
            return [['commune', 'conseiller'], []];
        }

        $headers = array_keys($entries[0]);
        $data    = array_map(function ($entry) use ($headers) {
            return array_map(function ($h) use ($entry) {
                $v = $entry[$h] ?? null;

                return match (true) {
                    is_bool($v)      => $v ? 'Oui' : 'Non',
                    is_null($v)      => '',
                    $v === '' => '',
                    in_array($h, self::TRAILING_COLUMNS, true) => $this->formatTimestamp((string) $v),
                    default          => (string) $v,
                };
            }, $headers);
        }, $entries);

        return [$headers, $data];
    }

    /**
     * Ajoute, à la fin des lignes (ou après chaque groupe si `$groupByKey` est
     * fourni), une ligne de total calculée en sommant des colonnes numériques
     * déjà aplaties — reproduisant le total affiché en direct dans l'aperçu
     * de la fiche (jamais stocké tel quel en base).
     *
     * @return array<int, array<int, string>>
     */
    private function appendTotalRows(array $headers, array $data, array $sumKeys, string $label, ?string $groupByKey = null): array
    {
        $sumIndexes = array_values(array_filter(array_map(
            fn ($key) => array_search($key, $headers, true),
            $sumKeys,
        ), fn ($i) => $i !== false));

        if ($sumIndexes === [] || $data === []) {
            return $data;
        }

        $groupIndex = $groupByKey !== null ? array_search($groupByKey, $headers, true) : false;

        if ($groupIndex === false) {
            return array_merge($data, [$this->buildTotalRow($headers, $data, $sumIndexes, $label)]);
        }

        $result       = [];
        $bucket       = [];
        $currentGroup = null;
        foreach ($data as $row) {
            $group = $row[$groupIndex];
            if ($currentGroup !== null && $group !== $currentGroup) {
                $result[] = $this->buildTotalRow($headers, $bucket, $sumIndexes, $label);
                $bucket   = [];
            }
            $currentGroup = $group;
            $bucket[]      = $row;
            $result[]      = $row;
        }
        if ($bucket !== []) {
            $result[] = $this->buildTotalRow($headers, $bucket, $sumIndexes, $label);
        }

        return $result;
    }

    /**
     * @param array<int, int> $sumIndexes
     *
     * @return array<int, string>
     */
    private function buildTotalRow(array $headers, array $rows, array $sumIndexes, string $label): array
    {
        $total    = array_fill(0, count($headers), '');
        $total[0] = $label;
        foreach ($sumIndexes as $idx) {
            $sum = 0.0;
            foreach ($rows as $row) {
                $sum += (float) ($row[$idx] ?: 0);
            }
            $total[$idx] = (string) (fmod($sum, 1.0) === 0.0 ? (int) $sum : $sum);
        }

        return $total;
    }

    /**
     * Ajoute une colonne « Période d'exécution » calculée en direct à partir
     * de deux colonnes date (début/fin), comme l'affiche l'aperçu de la fiche
     * Négociation accord — jamais stockée telle quelle en base.
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function computePeriodeColumn(array $headers, array $data, string $debutKey, string $finKey, string $targetKey, string $insertBeforeKey): array
    {
        $debutIdx = array_search($debutKey, $headers, true);
        $finIdx   = array_search($finKey, $headers, true);
        if ($debutIdx === false && $finIdx === false) {
            return [$headers, $data];
        }

        $values = array_map(function ($row) use ($debutIdx, $finIdx) {
            $d1 = $debutIdx !== false ? ($row[$debutIdx] ?? '') : '';
            $d2 = $finIdx !== false ? ($row[$finIdx] ?? '') : '';

            return match (true) {
                $d1 !== '' && $d2 !== '' => "Du {$d1} au {$d2}",
                $d1 !== ''               => "À partir du {$d1}",
                $d2 !== ''               => "Jusqu'au {$d2}",
                default                  => '',
            };
        }, $data);

        $insertIndex = array_search($insertBeforeKey, $headers, true);
        $insertIndex = $insertIndex === false ? count($headers) : $insertIndex;

        array_splice($headers, $insertIndex, 0, [$targetKey]);
        foreach ($data as $i => &$row) {
            array_splice($row, $insertIndex, 0, [$values[$i]]);
        }
        unset($row);

        return [$headers, $data];
    }

    /**
     * Développe un jeu de données « registre » (journal de caisse, fiche de
     * stock) : un blob JSON par commune avec un solde de départ (`report`) et
     * des lignes de mouvements — en calculant, comme l'aperçu de la fiche, le
     * solde cumulé après chaque ligne (jamais stocké tel quel en base).
     *
     * @param array<int, string> $entreeKeys clés des lignes qui augmentent le solde
     * @param array<int, string> $sortieKeys clés des lignes qui diminuent le solde
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function expandLedgerRows(Collection $rows, array $fkMaps, string $reportPath, array $entreeKeys, array $sortieKeys, string $balanceKey, array $trailingKeys = []): array
    {
        $entries = [];
        foreach ($rows as $row) {
            $donnees    = $row->donnees ?? [];
            $commune    = $fkMaps['commune_id'][$row->commune_id] ?? '';
            $conseiller = $fkMaps['user_id'][$row->user_id] ?? '';
            $lignes     = Arr::get($donnees, 'lignes');
            if (! is_array($lignes)) {
                continue;
            }

            $balance = (float) (Arr::get($donnees, $reportPath) ?: 0);

            foreach ($lignes as $ligne) {
                if (! is_array($ligne)) {
                    continue;
                }

                $entry = ['commune' => $commune, 'conseiller' => $conseiller];
                foreach ($ligne as $k => $v) {
                    if (in_array($k, $trailingKeys, true)) {
                        continue;
                    }
                    $entry[$k] = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
                }

                $in  = array_sum(array_map(fn ($k) => (float) ($ligne[$k] ?? 0), $entreeKeys));
                $out = array_sum(array_map(fn ($k) => (float) ($ligne[$k] ?? 0), $sortieKeys));
                $balance += $in - $out;
                $entry[$balanceKey] = $balance;

                foreach ($trailingKeys as $k) {
                    $v          = $ligne[$k] ?? null;
                    $entry[$k]  = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
                }

                $entry['created_at'] = optional($row->created_at)->toISOString() ?? '';
                $entry['updated_at'] = optional($row->updated_at)->toISOString() ?? '';
                $entries[]           = $entry;
            }
        }

        if ($entries === []) {
            return [['commune', 'conseiller'], []];
        }

        $headers = array_keys($entries[0]);
        $data    = array_map(function ($entry) use ($headers) {
            return array_map(function ($h) use ($entry) {
                $v = $entry[$h] ?? null;

                return match (true) {
                    is_bool($v) => $v ? 'Oui' : 'Non',
                    is_null($v) => '',
                    in_array($h, self::TRAILING_COLUMNS, true) && $v !== '' => $this->formatTimestamp((string) $v),
                    default => (string) $v,
                };
            }, $headers);
        }, $entries);

        return [$headers, $data];
    }

    /**
     * Développe un jeu de données « objet JSON clé par entité » (un blob par
     * commune, avec un sous-objet par marché : marche1/marche2/marche3…) en
     * une ligne par entité — plus exploitable pour l'analyse qu'une grille
     * transposée (marchés en colonnes), même si elle diffère visuellement de
     * l'aperçu de la fiche.
     *
     * @param array<string, string> $keyLabels libellé lisible pour chaque clé de l'objet (ex : 'marche1' => 'Marché 1')
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function expandKeyedRows(Collection $rows, array $fkMaps, ?string $path, string $entityLabel, array $keyLabels = []): array
    {
        $entries = [];
        foreach ($rows as $row) {
            $donnees = $row->donnees ?? [];
            $obj     = Arr::get($donnees, $path);
            if (! is_array($obj)) {
                continue;
            }

            $commune    = $fkMaps['commune_id'][$row->commune_id] ?? '';
            $conseiller = $fkMaps['user_id'][$row->user_id] ?? '';

            foreach ($obj as $key => $fields) {
                // Ignore toute clé hors de la liste attendue (ex : un enregistrement
                // dont le seeder générique n'a pas encore été remplacé par une vraie
                // saisie) plutôt que de générer une ligne à partir de son contenu.
                if ($keyLabels !== [] && ! isset($keyLabels[$key])) {
                    continue;
                }
                if (! is_array($fields)) {
                    // Certaines fiches stockent un simple score scalaire par clé
                    // (ex : Analyse qualité des sols), sans sous-objet {score,...}.
                    $fields = ['valeur' => $fields];
                } elseif (array_is_list($fields)) {
                    continue;
                }

                $entry              = ['commune' => $commune, 'conseiller' => $conseiller];
                $entry[$entityLabel] = $keyLabels[$key] ?? $key;
                foreach ($fields as $k => $v) {
                    $entry[$k] = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
                }
                $entry['created_at'] = optional($row->created_at)->toISOString() ?? '';
                $entry['updated_at'] = optional($row->updated_at)->toISOString() ?? '';
                $entries[]           = $entry;
            }
        }

        if ($entries === []) {
            return [['commune', 'conseiller', $entityLabel], []];
        }

        $headers = array_keys($entries[0]);
        $data    = array_map(function ($entry) use ($headers) {
            return array_map(function ($h) use ($entry) {
                $v = $entry[$h] ?? null;

                return match (true) {
                    is_bool($v) => $v ? 'Oui' : 'Non',
                    is_null($v) => '',
                    in_array($h, self::TRAILING_COLUMNS, true) && $v !== '' => $this->formatTimestamp((string) $v),
                    default => (string) $v,
                };
            }, $headers);
        }, $entries);

        return [$headers, $data];
    }

    /**
     * Ajoute des colonnes calculées en direct (jamais stockées telles quelles)
     * à un tableau de lignes déjà aplaties, chacune étant la somme ou la
     * différence de colonnes existantes.
     *
     * @param array<string, array{op: string, keys: array<int, string>}> $computed
     *        ex : ['charges_totales' => ['op' => 'sum', 'keys' => [...]],
     *              'marge_brute'     => ['op' => 'sub', 'keys' => ['produit_brut', 'charges_totales']]]
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function appendComputedColumns(array $headers, array $data, array $computed): array
    {
        foreach ($computed as $newKey => $spec) {
            $indexes = array_map(fn ($k) => array_search($k, $headers, true), $spec['keys']);

            foreach ($data as &$row) {
                $values = array_map(fn ($idx) => $idx !== false ? (float) ($row[$idx] ?: 0) : 0.0, $indexes);
                $result = $spec['op'] === 'sub'
                    ? array_reduce(array_slice($values, 1), fn ($carry, $v) => $carry - $v, $values[0] ?? 0.0)
                    : array_sum($values);
                $row[] = (string) (fmod($result, 1.0) === 0.0 ? (int) $result : round($result, 2));
            }
            unset($row);

            $headers[] = $newKey;
        }

        return [$headers, $data];
    }

    /**
     * Développe une grille JSON à clé composite (ex : Programmation marché,
     * où chaque case "{opération}_{mois}_{décade}" est une clé plate du blob)
     * en une ligne par case réellement renseignée — bien plus exploitable
     * qu'une grille à ~80 colonnes presque toutes vides.
     *
     * @param array<string, string> $slugs  clé d'opération => libellé
     * @param array<string, string> $dim2   clé de la 2e dimension (ex : mois) => libellé
     * @param array<string, string> $dim3   clé de la 3e dimension (ex : décade) => libellé
     *
     * @return array{0: array<int, string>, 1: array<int, array<int, string>>}
     */
    private function expandFlatMatrixRows(Collection $rows, array $fkMaps, array $config): array
    {
        ['slugs' => $slugs, 'dim2' => $dim2, 'dim3' => $dim3] = $config;

        $entries = [];
        foreach ($rows as $row) {
            $donnees = $row->donnees ?? [];
            if (! is_array($donnees)) {
                continue;
            }

            $commune    = $fkMaps['commune_id'][$row->commune_id] ?? '';
            $conseiller = $fkMaps['user_id'][$row->user_id] ?? '';

            foreach ($slugs as $slugKey => $slugLabel) {
                foreach ($dim2 as $d2Key => $d2Label) {
                    foreach ($dim3 as $d3Key => $d3Label) {
                        $value = $donnees["{$slugKey}_{$d2Key}_{$d3Key}"] ?? null;
                        if ($value === null || $value === '') {
                            continue;
                        }

                        $entries[] = [
                            'commune'     => $commune,
                            'conseiller'  => $conseiller,
                            'operation'   => $slugLabel,
                            'mois'        => $d2Label,
                            'decade'      => $d3Label,
                            'valeur'      => $value,
                            'created_at'  => optional($row->created_at)->toISOString() ?? '',
                            'updated_at'  => optional($row->updated_at)->toISOString() ?? '',
                        ];
                    }
                }
            }
        }

        if ($entries === []) {
            return [['commune', 'conseiller', 'operation', 'mois', 'decade', 'valeur'], []];
        }

        $headers = array_keys($entries[0]);
        $data    = array_map(function ($entry) use ($headers) {
            return array_map(function ($h) use ($entry) {
                $v = $entry[$h] ?? null;

                return match (true) {
                    is_bool($v) => $v ? 'Oui' : 'Non',
                    is_null($v) => '',
                    in_array($h, self::TRAILING_COLUMNS, true) && $v !== '' => $this->formatTimestamp((string) $v),
                    default => (string) $v,
                };
            }, $headers);
        }, $entries);

        return [$headers, $data];
    }

    /**
     * Précharge, en un minimum de requêtes, les libellés des clés étrangères connues
     * (utilisateur, commune, département, arrondissement, CEP) présentes dans la table.
     *
     * @return array<string, array<int, string>>
     */
    private function resolveForeignKeys(Collection $rows, string $table): array
    {
        $maps = [];

        foreach (self::FK_RESOLVERS as $column => $resolver) {
            if (! Schema::hasColumn($table, $column)) {
                continue;
            }

            $ids = $rows->pluck($column)->filter()->unique()->values();
            if ($ids->isEmpty()) {
                continue;
            }

            $maps[$column] = $resolver['model']::query()
                ->whereIn('id', $ids)
                ->pluck($resolver['attribute'], 'id')
                ->all();
        }

        return $maps;
    }

    /**
     * Aplatit les modèles (y compris les colonnes JSON) en lignes tabulaires,
     * avec une liste de colonnes = union ordonnée des clés rencontrées.
     *
     * @param array<string, array<int, string>> $fkMaps
     */
    private function flatten(Collection $rows, string $table, array $fkMaps, string $type): array
    {
        if ($rows->isEmpty()) {
            return [$this->orderHeaders(array_values(array_diff(Schema::getColumnListing($table), self::EXCLUDED_COLUMNS))), []];
        }

        $headers  = [];
        $flatRows = [];

        foreach ($rows as $row) {
            $flat = [];
            foreach ($row->attributesToArray() as $key => $value) {
                if (in_array($key, self::EXCLUDED_COLUMNS, true)) {
                    continue;
                }
                if (in_array($key, self::JOINED_LIST_COLUMNS, true) && is_array($value)) {
                    $flat[$key] = collect($value)
                        ->map(function ($v) {
                            if (is_array($v)) {
                                $v = implode(' — ', array_filter(array_map(
                                    fn ($p) => trim((string) $p),
                                    $v,
                                ), fn ($s) => $s !== ''));
                            }

                            return trim((string) $v);
                        })
                        ->filter(fn ($v) => $v !== '')
                        ->map(fn ($v) => '- '.$v)
                        ->implode("\n");
                } elseif (in_array($key, self::HTML_BULLET_COLUMNS, true) && is_string($value)) {
                    $flat[$key] = $this->htmlToBulletText($value);
                } elseif (isset($fkMaps[$key])) {
                    $flat[$key] = $value === null ? '' : ($fkMaps[$key][$value] ?? "#{$value}");
                } elseif (is_array($value)) {
                    foreach (Arr::dot($value, $key.'.') as $dotKey => $dotValue) {
                        $flat[$dotKey] = is_array($dotValue) ? json_encode($dotValue, JSON_UNESCAPED_UNICODE) : $dotValue;
                    }
                } else {
                    $flat[$key] = $value;
                }
            }

            foreach ($this->computeExtraColumns($type, $row) as $key => $value) {
                $flat[$key] = $value;
            }

            foreach (array_keys($flat) as $key) {
                if (! in_array($key, $headers, true)) {
                    $headers[] = $key;
                }
            }

            $flatRows[] = $flat;
        }

        $headers = $this->orderHeaders($headers);

        $data = array_map(function ($flat) use ($headers) {
            return array_map(function ($header) use ($flat) {
                $value = $flat[$header] ?? null;

                return match (true) {
                    is_bool($value) => $value ? 'Oui' : 'Non',
                    is_null($value) => '',
                    in_array($header, self::TRAILING_COLUMNS, true) => $this->formatTimestamp((string) $value),
                    default          => (string) $value,
                };
            }, $headers);
        }, $flatRows);

        return [$headers, $data];
    }

    /**
     * Horodatage d'audit lisible (« 03/07/2026 21:27 ») plutôt que la
     * sérialisation ISO brute du modèle.
     */
    private function formatTimestamp(string $value): string
    {
        try {
            return Carbon::parse($value)->timezone(config('app.timezone'))->format('d/m/Y H:i');
        } catch (\Throwable) {
            return $value;
        }
    }

    /**
     * Convertit un contenu HTML riche (éditeur WYSIWYG, ex : la matrice FFOM)
     * en texte à puces lisible dans un tableur — plutôt que d'exporter les
     * balises brutes.
     */
    private function htmlToBulletText(?string $html): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        $html = preg_replace('/<li[^>]*>/i', "\n- ", $html);
        $html = preg_replace('/<\/(li|p|div)>/i', "\n", $html);
        $html = preg_replace('/<br\s*\/?>/i', "\n", $html);
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5);
        $lines = array_filter(array_map('trim', explode("\n", $text)), fn ($l) => $l !== '');

        return implode("\n", $lines);
    }

    /**
     * Ordonne les colonnes pour l'analyse : identifiants et contexte (conseiller,
     * département, commune, CEP…) en tête, données métier au centre, métadonnées
     * d'audit (dates de création/modification) en fin.
     */
    private function orderHeaders(array $headers): array
    {
        $leading  = array_values(array_intersect(self::LEADING_COLUMNS, $headers));
        $trailing = array_values(array_intersect(self::TRAILING_COLUMNS, $headers));
        $middle   = array_values(array_diff($headers, $leading, $trailing));

        return array_merge($leading, $middle, $trailing);
    }

    /**
     * Indices des colonnes « données métier » (ni contexte géographique/identifiant,
     * ni métadonnée d'audit), mises en évidence par un en-tête distinct sur les
     * jeux de données qui l'activent (ex : Profil historique).
     *
     * @return array<int, int>
     */
    private function contentColumnIndices(array $headers, array $dataset): array
    {
        if (! ($dataset['highlight_content_headers'] ?? false)) {
            return [];
        }

        return array_values(array_filter(
            array_keys($headers),
            fn ($i) => ! in_array($headers[$i], self::LEADING_COLUMNS, true)
                && ! in_array($headers[$i], self::TRAILING_COLUMNS, true)
        ));
    }

    /**
     * Colonnes calculées à partir de relations hasMany/hasOne, propres à certains jeux de données
     * (ex : liste des membres d'un CEP, absente des colonnes brutes de la table).
     *
     * @return array<string, string>
     */
    private function computeExtraColumns(string $type, $row): array
    {
        return match ($type) {
            'cep' => [
                'membres' => $row->membres
                    ->map(function ($membre) {
                        $participant = $membre->participant;
                        $nom = trim(($participant->nom_producteur ?? '').' '.($participant->prenoms_producteur ?? ''));
                        $role = $membre->responsabilite ? " ({$membre->responsabilite})" : '';

                        return $nom !== '' ? '- '.$nom.$role : null;
                    })
                    ->filter()
                    ->implode("\n"),
            ],
            default => [],
        };
    }

    /**
     * Transforme un jeu de données "une ligne par domaine/spéculation" en "une ligne par village",
     * avec le domaine, le score et le rang dans trois colonnes distinctes (une entrée par ligne,
     * préfixée d'un tiret). Les trois colonnes restent alignées ligne à ligne car aucune d'elles
     * n'est autorisée à se replier automatiquement (pas de retour à la ligne forcé par la largeur) :
     * seuls les sauts de ligne explicites comptent, donc le nombre de lignes visuelles reste
     * identique dans les trois colonnes quelle que soit la longueur du texte.
     *
     * @param array<string, array<int, string>> $fkMaps
     */
    private function pivotByVillage(Collection $rows, array $fkMaps, string $mode): array
    {
        $labelKey = $mode === 'speculation' ? 'domaine_speculation' : 'domaine_activite';
        $lines    = [];

        foreach ($rows->groupBy('profil_historique_id') as $profilId => $group) {
            $first  = $group->first();
            $labels = [];
            $scores = [];
            $rangs  = [];

            foreach ($group as $row) {
                $label = $mode === 'speculation'
                    ? trim(($row->domaine_activite ?? '').' — '.($row->speculation_agricole ?? ''), " —")
                    : (string) ($row->domaine_activite ?? '');

                if ($label === '') {
                    continue;
                }

                $labels[] = '- '.$label;
                $scores[] = '- '.($row->score !== null ? (string) $row->score : '');
                $rangs[]  = '- '.($row->rang !== null ? (string) $row->rang : '');
            }

            $lines[] = [
                'village'    => $fkMaps['profil_historique_id'][$profilId] ?? ($profilId ? "#{$profilId}" : ''),
                'conseiller' => $fkMaps['user_id'][$first->user_id] ?? '',
                $labelKey    => implode("\n", $labels),
                'score'      => implode("\n", $scores),
                'rang'       => implode("\n", $rangs),
            ];
        }

        $headers = ['village', 'conseiller', $labelKey, 'score', 'rang'];
        $data    = array_map(fn ($line) => array_map(fn ($h) => $line[$h] ?? '', $headers), $lines);

        return [$headers, $data];
    }

    /**
     * Transforme une clé technique ("commune_id", "donnees.items.0.label") en libellé lisible.
     */
    private function humanizeHeader(string $key): string
    {
        $segments = explode('.', $key);
        $parts    = [];

        foreach ($segments as $segment) {
            if (ctype_digit($segment)) {
                if ($parts !== []) {
                    $parts[count($parts) - 1] .= ' #'.((int) $segment + 1);
                }
                continue;
            }

            $parts[] = self::FK_RESOLVERS[$segment]['label']
                ?? self::COLUMN_LABELS[$segment]
                ?? ucfirst(str_replace('_', ' ', $segment));
        }

        return implode(' — ', $parts);
    }

    private function exportCsv(array $columnLabels, array $data, string $filename)
    {
        return response()->streamDownload(function () use ($columnLabels, $data) {
            $writer = new CsvWriter(new CsvOptions(FIELD_DELIMITER: ';'));
            $writer->openToFile('php://output');
            $writer->addRow(Row::fromValues($columnLabels));
            foreach ($data as $row) {
                $writer->addRow(Row::fromValues($row));
            }
            $writer->close();
        }, "{$filename}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Thème visuel des exports, calqué sur les aperçus des fiches dans
     * l'application :
     *  - fiches CEP / Sensibilisation / Activités CEP → fiche papier officielle
     *    (bandeau vert #8BCF45, quadrillage noir, en-têtes en majuscules) ;
     *  - fiches CAI → en-têtes ambre foncé #78350F sur texte blanc,
     *    quadrillage clair ;
     *  - Administration → neutre ardoise.
     *
     * @return array{band_bg: string, band_text: string, head_bg: string, head_text: string, border: string, uppercase: bool}
     */
    private function groupTheme(?string $group): array
    {
        if ($group !== null && str_starts_with($group, 'CAI')) {
            return [
                'band_bg' => '78350F', 'band_text' => 'FFFFFF',
                'head_bg' => '78350F', 'head_text' => 'FFFFFF',
                'border'  => 'CCCCCC', 'uppercase' => false,
            ];
        }

        if ($group === 'Administration') {
            return [
                'band_bg' => '334155', 'band_text' => 'FFFFFF',
                'head_bg' => '334155', 'head_text' => 'FFFFFF',
                'border'  => 'CBD5E1', 'uppercase' => false,
            ];
        }

        return [
            'band_bg' => '8BCF45', 'band_text' => '0F172A',
            'head_bg' => 'FFFFFF', 'head_text' => '000000',
            'border'  => '000000', 'uppercase' => true,
        ];
    }

    /**
     * Variante du thème avec couleurs préfixées « # », prête pour le CSS du PDF.
     */
    private function pdfTheme(?string $group): array
    {
        $theme = $this->groupTheme($group);

        return array_map(
            fn ($value) => is_string($value) ? '#'.$value : $value,
            $theme,
        );
    }

    private function cellBorder(string $color): Border
    {
        return new Border(
            new BorderPart(BorderName::TOP, $color, BorderWidth::THIN, BorderStyle::SOLID),
            new BorderPart(BorderName::BOTTOM, $color, BorderWidth::THIN, BorderStyle::SOLID),
            new BorderPart(BorderName::LEFT, $color, BorderWidth::THIN, BorderStyle::SOLID),
            new BorderPart(BorderName::RIGHT, $color, BorderWidth::THIN, BorderStyle::SOLID),
        );
    }

    /**
     * Indices des colonnes qui ne doivent jamais se replier dans le PDF
     * (listes synchronisées ligne à ligne — voir SYNCED_LIST_COLUMNS).
     */
    private function noWrapColumns(array $headers): array
    {
        return array_values(array_filter(
            array_keys($headers),
            fn ($i) => in_array($headers[$i], self::SYNCED_LIST_COLUMNS, true)
                || in_array($headers[$i], self::SHORT_VALUE_COLUMNS, true)
        ));
    }

    /**
     * Classeur XLSX (une feuille par fiche), au style exact des aperçus de
     * l'application : bandeau de titre fusionné aux couleurs du module,
     * quadrillage complet, ligne d'en-têtes figée et filtrable.
     */
    private function exportGroupXlsx(array $sections, string $filename)
    {
        return response()->streamDownload(function () use ($sections) {
            $options = new XlsxOptions(DEFAULT_COLUMN_WIDTH: 24);
            $writer  = new XlsxWriter($options);
            $writer->openToFile('php://output');

            $usedNames = [];
            foreach ($sections as $i => $section) {
                $theme  = $this->groupTheme($section['group'] ?? null);
                $border = $this->cellBorder($theme['border']);

                $bandStyle = new Style(
                    fontBold: true,
                    fontItalic: ($section['contentColumns'] ?? []) !== [],
                    fontSize: 12,
                    fontColor: $theme['band_text'],
                    backgroundColor: $theme['band_bg'],
                    cellAlignment: CellAlignment::CENTER,
                    cellVerticalAlignment: CellVerticalAlignment::CENTER,
                    border: $border,
                );
                $headStyle = new Style(
                    fontBold: true,
                    fontColor: $theme['head_text'],
                    backgroundColor: $theme['head_bg'],
                    cellAlignment: $theme['uppercase'] ? CellAlignment::LEFT : CellAlignment::CENTER,
                    cellVerticalAlignment: CellVerticalAlignment::TOP,
                    shouldWrapText: true,
                    border: $border,
                );
                // En-tête « données métier », distingué du contexte géographique
                // (fond gris, italique, casse d'origine) — voir contentColumnIndices().
                $contentHeadStyle = new Style(
                    fontBold: true,
                    fontItalic: true,
                    fontColor: '000000',
                    backgroundColor: 'D9D9D9',
                    cellAlignment: CellAlignment::LEFT,
                    cellVerticalAlignment: CellVerticalAlignment::TOP,
                    shouldWrapText: true,
                    border: $border,
                );
                $rowStyle = new Style(
                    border: $border,
                    shouldWrapText: true,
                    cellVerticalAlignment: CellVerticalAlignment::TOP,
                );

                $sheet = $i === 0 ? $writer->getCurrentSheet() : $writer->addNewSheetAndMakeItCurrent();
                $sheet->setName($this->sheetName($section['sheet'], $usedNames));

                if ($section['blocks'] !== null) {
                    $this->writeDomainesBlocksSheet($writer, $options, $sheet, $section['blocks'], $bandStyle, $border, $i);

                    continue;
                }

                if ($section['gridHeader'] !== null) {
                    $this->writeGridHeaderSheet($writer, $options, $sheet, $section, $border, $i);

                    continue;
                }

                $sheet->setSheetView((new SheetView())->withFreezeRow(3));

                $colCount = count($section['columnLabels']);
                if ($colCount > 0) {
                    $sheet->setAutoFilter(new AutoFilter(0, 2, $colCount - 1, 2));
                    $options->mergeCells(0, 1, $colCount - 1, 1, $i);
                }
                $wideColumns = array_values(array_filter(
                    array_keys($section['headers']),
                    fn ($j) => in_array($section['headers'][$j], self::WIDE_LIST_COLUMNS, true)
                ));
                if ($wideColumns !== []) {
                    $sheet->setColumnWidth(46, ...$wideColumns);
                }

                // Bandeau de titre, comme la ligne de titre des aperçus
                $band = array_pad([$section['label']], max($colCount, 1), '');
                $writer->addRow(Row::fromValuesWithStyle($band, $bandStyle));

                $contentColumns = $section['contentColumns'] ?? [];
                $labels = array_map(
                    fn ($label, $j) => $theme['uppercase'] && ! in_array($j, $contentColumns, true)
                        ? mb_strtoupper($label, 'UTF-8')
                        : $label,
                    $section['columnLabels'], array_keys($section['columnLabels']),
                );
                $headColumnStyles = array_fill(0, $colCount, $headStyle);
                foreach ($contentColumns as $j) {
                    $headColumnStyles[$j] = $contentHeadStyle;
                }
                $writer->addRow(Row::fromValuesWithStyles($labels, $headColumnStyles));

                foreach ($section['data'] as $row) {
                    $writer->addRow(Row::fromValuesWithStyle($row, $rowStyle));
                }
            }
            $writer->close();
        }, "{$filename}.xlsx", ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /**
     * Écrit, sur la feuille courante, une grille par village (« Domaine
     * d'activités / Score / Rang »), au format du formulaire de saisie :
     * un bandeau de titre, puis pour chaque village un sous-titre, un
     * mini en-tête et ses lignes de domaines.
     */
    private function writeDomainesBlocksSheet(XlsxWriter $writer, XlsxOptions $options, Sheet $sheet, array $blocks, Style $bandStyle, Border $border, int $sheetIndex): void
    {
        $cols = 3;

        $subtitleStyle = new Style(
            fontBold: true,
            fontItalic: true,
            fontColor: 'FFFFFF',
            backgroundColor: '062824',
            cellAlignment: CellAlignment::LEFT,
            cellVerticalAlignment: CellVerticalAlignment::CENTER,
            border: $border,
        );
        $miniHeadStyle = new Style(
            fontBold: true,
            fontColor: '000000',
            backgroundColor: 'D9D9D9',
            cellAlignment: CellAlignment::LEFT,
            cellVerticalAlignment: CellVerticalAlignment::CENTER,
            border: $border,
        );
        $domaineStyle = new Style(fontBold: true, border: $border, cellVerticalAlignment: CellVerticalAlignment::TOP);
        $valueStyle   = new Style(border: $border, cellVerticalAlignment: CellVerticalAlignment::TOP);

        $sheet->setColumnWidth(40, 0);
        $sheet->setSheetView((new SheetView())->withFreezeRow(1));

        $band = array_pad([$blocks['band']], $cols, '');
        $writer->addRow(Row::fromValuesWithStyle($band, $bandStyle));
        $options->mergeCells(0, 1, $cols - 1, 1, $sheetIndex);
        $rowNum = 1;

        foreach ($blocks['items'] as $block) {
            $rowNum++;
            $writer->addRow(Row::fromValuesWithStyle(array_pad([$block['subtitle']], $cols, ''), $subtitleStyle));
            $options->mergeCells(0, $rowNum, $cols - 1, $rowNum, $sheetIndex);

            $rowNum++;
            $writer->addRow(Row::fromValuesWithStyle($block['columns'], $miniHeadStyle));

            foreach ($block['rows'] as $row) {
                $rowNum++;
                $writer->addRow(Row::fromValuesWithStyles($row, [0 => $domaineStyle, 1 => $valueStyle, 2 => $valueStyle]));
            }

            $rowNum++;
            $writer->addRow(Row::fromValues(array_fill(0, $cols, '')));
        }
    }

    /**
     * Écrit, sur la feuille courante, un en-tête à deux lignes fusionnées
     * (groupes de colonnes sur la première, sous-libellés sur la seconde),
     * au format du gabarit papier du Bilan mensuel des sessions d'animation.
     */
    private function writeGridHeaderSheet(XlsxWriter $writer, XlsxOptions $options, Sheet $sheet, array $section, Border $border, int $sheetIndex): void
    {
        $colCount = count($section['columnLabels']);
        if ($colCount === 0) {
            return;
        }

        $gridHeader = $section['gridHeader'];
        [$row1, $row2] = $gridHeader['rows'];

        $bandStyle = new Style(
            fontBold: true,
            fontSize: 12,
            fontColor: '000000',
            backgroundColor: $gridHeader['band_bg'],
            cellAlignment: CellAlignment::CENTER,
            cellVerticalAlignment: CellVerticalAlignment::CENTER,
            border: $border,
        );
        $headCellStyle = fn (?string $color, ?string $bg) => new Style(
            fontBold: true,
            fontColor: $color ?? '000000',
            backgroundColor: $bg ?? 'D9D9D9',
            cellAlignment: CellAlignment::CENTER,
            cellVerticalAlignment: CellVerticalAlignment::CENTER,
            shouldWrapText: true,
            border: $border,
        );
        $rowStyle = new Style(border: $border, shouldWrapText: true, cellVerticalAlignment: CellVerticalAlignment::TOP);

        $hasSubHeader = $row2 !== [];
        $headerRows   = $hasSubHeader ? 2 : 1;

        $sheet->setSheetView((new SheetView())->withFreezeRow(2 + $headerRows));
        $sheet->setAutoFilter(new AutoFilter(0, 1 + $headerRows, $colCount - 1, 1 + $headerRows));
        $options->mergeCells(0, 1, $colCount - 1, 1, $sheetIndex);

        $writer->addRow(Row::fromValuesWithStyle(array_pad([$section['label']], $colCount, ''), $bandStyle));

        // Ligne 1 : un groupe fusionné horizontalement (colspan) ou, si le gabarit
        // n'a aucun regroupement, un simple en-tête à une ligne (rowspan=1).
        $labels1 = array_map(fn ($cell) => $cell['label'], $row1);
        $styles1 = array_map(fn ($cell) => $headCellStyle($cell['color'] ?? null, $cell['bg'] ?? null), $row1);
        $writer->addRow(Row::fromValuesWithStyles($labels1, $styles1));

        if (! $hasSubHeader) {
            foreach ($section['data'] as $row) {
                $writer->addRow(Row::fromValuesWithStyle($row, $rowStyle));
            }

            return;
        }

        // Ligne 2 : sous-libellés positionnés sous leur groupe ; case vide
        // (fusionnée verticalement) sous les colonnes à rowspan.
        $row2Full   = array_fill(0, $colCount, '');
        $row2Styles = array_fill(0, $colCount, $headCellStyle(null, null));
        $col        = 0;
        $subIndex   = 0;
        foreach ($row1 as $cell) {
            if ($cell['rowspan'] === 2) {
                $options->mergeCells($col, 2, $col, 3, $sheetIndex);
            } else {
                for ($k = 0; $k < $cell['colspan']; $k++) {
                    $sub                   = $row2[$subIndex++];
                    $row2Full[$col + $k]   = $sub['label'];
                    $row2Styles[$col + $k] = $headCellStyle($sub['color'] ?? null, $sub['bg'] ?? null);
                }
                if ($cell['colspan'] > 1) {
                    $options->mergeCells($col, 2, $col + $cell['colspan'] - 1, 2, $sheetIndex);
                }
            }
            $col += $cell['colspan'];
        }
        $writer->addRow(Row::fromValuesWithStyles($row2Full, $row2Styles));

        foreach ($section['data'] as $row) {
            $writer->addRow(Row::fromValuesWithStyle($row, $rowStyle));
        }
    }

    /**
     * Nom de feuille Excel valide (31 caractères max, sans []:*?/\), unique
     * dans le classeur.
     */
    private function sheetName(string $label, array &$usedNames): string
    {
        $name = trim(preg_replace('/[\\\\\/\?\*\[\]:]+/', ' ', $label) ?? '');
        $name = mb_substr($name, 0, 31) ?: 'Feuille';

        $base    = $name;
        $suffix  = 2;
        while (in_array($name, $usedNames, true)) {
            $name = mb_substr($base, 0, 28).' '.$suffix++;
        }
        $usedNames[] = $name;

        return $name;
    }

    /**
     * Archive ZIP du groupe complet : un fichier CSV par fiche.
     */
    private function exportGroupCsv(array $sections, string $filename)
    {
        $zipPath = tempnam(sys_get_temp_dir(), 'export-').'.zip';

        $zip = new \ZipArchive();
        $zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);

        $tempFiles = [];
        foreach ($sections as $section) {
            $csvPath = tempnam(sys_get_temp_dir(), 'export-csv-');
            $writer  = new CsvWriter(new CsvOptions(FIELD_DELIMITER: ';'));
            $writer->openToFile($csvPath);
            $writer->addRow(Row::fromValues($section['columnLabels']));
            foreach ($section['data'] as $row) {
                $writer->addRow(Row::fromValues($row));
            }
            $writer->close();

            $zip->addFile($csvPath, $section['type'].'.csv');
            $tempFiles[] = $csvPath;
        }

        $zip->close();
        foreach ($tempFiles as $tempFile) {
            @unlink($tempFile);
        }

        return response()->download($zipPath, "{$filename}.zip", ['Content-Type' => 'application/zip'])
            ->deleteFileAfterSend(true);
    }

    /**
     * PDF (une section par fiche), au style exact des aperçus : bandeau de
     * titre aux couleurs du module et tableau quadrillé façon fiche officielle.
     */
    private function exportGroupPdf(string $groupLabel, array $sections, string $filename)
    {
        // Un groupe complet peut cumuler plusieurs milliers de lignes tous formulaires
        // confondus ; le moteur de mise en page HTML de dompdf reste plus lent que les
        // writers XLSX/CSV sur ce volume, d'où une limite de temps dédiée plus large.
        set_time_limit(180);

        $pdf = Pdf::loadView('exports.data-table', [
            'title'    => $groupLabel,
            'sections' => array_map(fn ($section) => [
                'title'          => $section['label'],
                'theme'          => $this->pdfTheme($section['group'] ?? null),
                'headers'        => $section['columnLabels'],
                'rows'           => $section['data'],
                'noWrapColumns'  => $this->noWrapColumns($section['headers']),
                'contentColumns' => $section['contentColumns'] ?? [],
                'blocks'         => $section['blocks'],
                'gridHeader'     => $section['gridHeader'],
            ], $sections),
        ])->setPaper('a4', 'landscape');

        return $pdf->download("{$filename}.pdf");
    }
}

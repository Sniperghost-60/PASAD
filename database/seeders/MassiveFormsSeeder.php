<?php

namespace Database\Seeders;

use App\Models\Arrondissement;
use App\Models\Commune;
use App\Models\Departement;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Seeder massif — remplit toutes les tables métier avec des données réalistes.
 *
 * Stratégie :
 *  1. Crée 120 utilisateurs (conseillers, superviseurs, admins) + leurs affectations.
 *  2. Seed les tables dans un ordre topologique strict (FK NOT NULL respectées).
 *  3. Génère les données avec des types natifs corrects (pas d'introspection fragile).
 *  4. Tables CAI seedées via un builder générique avec volumes importants.
 */
class MassiveFormsSeeder extends Seeder
{
    /** @var array<string, list<int|string>> */
    private array $idCache = [];

    /** @var array<string, string> */
    private array $lastErrors = [];

    private const ROWS_LARGE  = 200;
    private const ROWS_MEDIUM = 150;
    private const ROWS_CAI    = 130;

    private const SEXES      = ['M', 'F'];
    private const CATS_AGE   = ['J', 'A', 'V'];
    private const DOMAINES   = [
        'Agriculture', 'Elevage', 'Pêche', 'Commerce', 'Artisanat',
        'Maraîchage', 'Arboriculture fruitière', 'Transformation agroalimentaire',
    ];
    private const SPECULATIONS = [
        'Maïs', 'Sorgho', 'Mil', 'Soja', 'Niébé', 'Arachide', 'Manioc',
        'Igname', 'Coton', 'Riz', 'Tomate', 'Piment', 'Haricot vert',
    ];
    private const INNOVATIONS = [
        'Microdosage engrais', 'Zaï amélioré', 'Bandes enherbées',
        'Semis en ligne', 'Demi-lunes', 'Cordons pierreux', 'Compostage',
        'Rotation culturale', 'Association culturale',
    ];
    private const SOLUTIONS_TYPES = ['technique', 'organisationnelle', 'financière', 'institutionnelle'];
    private const STATUTS         = ['en_attente', 'en_cours', 'résolu'];
    private const JOURS_ANIMATION = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

    // ─────────────────────────────────────────────────────────────────────────

    public function run(): void
    {
        $faker = fake('fr_FR');

        $this->seedUsers($faker, 120);
        $this->seedConseillerAffectations($faker);

        $this->seedProfilHistorique($faker);
        $this->seedIdentificationParticipants($faker);
        $this->seedCep($faker);
        $this->seedCepMembres($faker);
        $this->seedMatriceProblemes($faker);
        $this->seedMatriceSolutions($faker);
        $this->seedResumeProtocoles($faker);
        $this->seedCurriculum($faker);
        $this->seedHierarchisationDomaines($faker);
        $this->seedHierarchisationSpeculations($faker);
        $this->seedBaseBeneficiaires($faker);
        $this->seedAnimationSessions($faker);
        $this->seedBilanSessions($faker);
        $this->seedOrganisationVisites($faker);
        $this->seedVisitesCommentees($faker);
        $this->seedRapportDemarrage($faker);
        $this->seedRendementDispositif($faker);
        $this->seedEvolutionRendements($faker);
        $this->seedAppVersions($faker);
        $this->seedCaiTables($faker);
        $this->seedListePresenceSensibilisation($faker);
        $this->seedDifficulteSuggestions($faker);

        $this->command?->info('✅ Seeding massif terminé.');

        if (! empty($this->lastErrors)) {
            $this->command?->warn('Erreurs partielles :');
            foreach ($this->lastErrors as $table => $err) {
                $this->command?->warn("  - {$table}: {$err}");
            }
        }

        $this->printStats();
    }

    // ─── Seeders explicites ────────────────────────────────────────────────────

    private function seedUsers(\Faker\Generator $faker, int $count): void
    {
        $roles = ['Conseiller', 'Conseiller', 'Conseiller', 'Superviseur', 'Administrateur'];
        for ($i = 0; $i < $count; $i++) {
            try {
                $u = User::create([
                    'name'              => $faker->name(),
                    'email'             => $faker->unique()->safeEmail(),
                    'telephone'         => $faker->numerify('9########'),
                    'password'          => Hash::make('password123'),
                    'email_verified_at' => now(),
                    'is_blocked'        => false,
                    'is_suspended'      => false,
                    'is_frozen'         => false,
                ]);
                $u->assignRole($faker->randomElement($roles));
            } catch (QueryException) { /* email duplicate */
            }
        }
    }

    private function seedConseillerAffectations(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $comIds = $this->ids('communes');
        $arrIds = $this->ids('arrondissements');

        foreach ($uids as $uid) {
            foreach ($faker->randomElements($comIds, min(5, count($comIds))) as $cid) {
                DB::table('conseiller_commune')->updateOrInsert(
                    ['user_id' => $uid, 'commune_id' => $cid],
                    ['created_at' => now(), 'updated_at' => now()],
                );
            }
            foreach ($faker->randomElements($arrIds, min(8, count($arrIds))) as $aid) {
                DB::table('conseiller_arrondissement')->updateOrInsert(
                    ['user_id' => $uid, 'arrondissement_id' => $aid],
                    ['created_at' => now(), 'updated_at' => now()],
                );
            }
        }
    }

    private function seedProfilHistorique(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $dids   = $this->ids('departements');
        $comIds = $this->ids('communes');
        $arrIds = $this->ids('arrondissements');
        if (empty($uids) || empty($dids) || empty($comIds) || empty($arrIds)) {
            return;
        }
        for ($i = 0; $i < self::ROWS_LARGE; $i++) {
            $this->ins('profil_historique', [
                'user_id'           => $faker->randomElement($uids),
                'departement_id'    => $faker->randomElement($dids),
                'commune_id'        => $faker->randomElement($comIds),
                'arrondissement_id' => $faker->randomElement($arrIds),
                'village'           => $faker->city(),
                'annee'             => $faker->numberBetween(2018, 2026),
                'evenements'        => $faker->paragraph(3),
                'impact'            => $faker->paragraph(2),
            ]);
        }
    }

    private function seedIdentificationParticipants(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $dids   = $this->ids('departements');
        $comIds = $this->ids('communes');
        $arrIds = $this->ids('arrondissements');
        if (empty($uids)) {
            return;
        }
        for ($i = 0; $i < self::ROWS_LARGE; $i++) {
            $annee  = $faker->numberBetween(1955, 2005);
            $age    = 2026 - $annee;
            $catAge = $age < 35 ? 'J' : ($age < 60 ? 'A' : 'V');
            $this->ins('identification_participants_cep', [
                'user_id'                 => $faker->randomElement($uids),
                'date_session'            => $faker->dateTimeBetween('-3 years')->format('Y-m-d'),
                'departement_id'          => $faker->optional(0.9)->randomElement($dids),
                'commune_id'              => $faker->optional(0.9)->randomElement($comIds),
                'arrondissement_id'       => $faker->optional(0.9)->randomElement($arrIds),
                'village'                 => $faker->city(),
                'nom_producteur'          => $faker->lastName(),
                'prenoms_producteur'      => $faker->firstName(),
                'contact1_producteur'     => $faker->numerify('9########'),
                'contact2_producteur'     => $faker->optional(0.4)->numerify('9########'),
                'sexe'                    => $faker->randomElement(self::SEXES),
                'annee_naissance'         => $annee,
                'categorie_age'           => $catAge,
                'speculation'             => $faker->randomElement(self::SPECULATIONS),
                'responsabilite_fonction' => $faker->randomElement(['Président', 'Secrétaire', 'Trésorier', 'Membre']),
            ]);
        }
    }

    private function seedCep(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $dids   = $this->ids('departements');
        $comIds = $this->ids('communes');
        $arrIds = $this->ids('arrondissements');
        if (empty($uids)) {
            return;
        }
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $this->ins('cep', [
                'user_id'           => $faker->randomElement($uids),
                'nom_cep'           => 'CEP ' . $faker->city() . ' ' . $faker->numberBetween(1, 99),
                'adresse'           => $faker->streetAddress(),
                'departement_id'    => $faker->optional(0.8)->randomElement($dids),
                'commune_id'        => $faker->optional(0.8)->randomElement($comIds),
                'arrondissement_id' => $faker->optional(0.8)->randomElement($arrIds),
                'village'           => $faker->city(),
                'latitude'          => $faker->randomFloat(7, 6.2, 12.4),
                'longitude'         => $faker->randomFloat(7, 0.8, 3.9),
            ]);
        }
    }

    private function seedCepMembres(\Faker\Generator $faker): void
    {
        $cepIds   = $this->ids('cep');
        $partIds  = $this->ids('identification_participants_cep');
        if (empty($cepIds) || empty($partIds)) {
            return;
        }
        $used  = [];
        $resps = ['Président', 'Secrétaire', 'Trésorier', 'Animateur', 'Membre', 'Coordonnateur'];
        foreach ($faker->shuffle($partIds) as $pid) {
            if (isset($used[$pid])) {
                continue;
            }
            $used[$pid] = true;
            $this->ins('cep_membres', [
                'cep_id'                            => $faker->randomElement($cepIds),
                'identification_participant_cep_id' => $pid,
                'responsabilite'                    => $faker->randomElement($resps),
            ]);
            if (count($used) >= self::ROWS_LARGE) {
                break;
            }
        }
    }

    private function seedMatriceProblemes(\Faker\Generator $faker): void
    {
        $phIds = $this->ids('profil_historique');
        $uids  = $this->ids('users');
        if (empty($phIds) || empty($uids)) {
            return;
        }
        $problemes = [
            'Faible rendement du maïs', 'Dégradation des sols', 'Manque d\'eau en saison sèche',
            'Accès difficile aux intrants', 'Mauvaise conservation post-récolte',
            'Pression parasitaire élevée', 'Manque de financement', 'Enclavement du village',
            'Faiblesse organisationnelle', 'Prix bas au moment de la récolte',
        ];
        $causes = [
            json_encode(['Pluviométrie irrégulière', 'Sols pauvres', 'Mauvais itinéraire technique']),
            json_encode(['Surexploitation des terres', 'Absence de compostage', 'Déforestation']),
            json_encode(['Pas de retenue d\'eau', 'Nappes peu profondes non exploitées']),
            json_encode(['Faible pouvoir d\'achat', 'Circuits d\'approvisionnement défaillants']),
        ];
        for ($i = 0; $i < self::ROWS_LARGE; $i++) {
            $this->ins('matrice_problemes', [
                'profil_historique_id' => $faker->randomElement($phIds),
                'user_id'              => $faker->randomElement($uids),
                'probleme'             => $faker->randomElement($problemes),
                'causes'               => $faker->randomElement($causes),
                'est_pertinent'        => $faker->boolean(70),
            ]);
        }
    }

    private function seedMatriceSolutions(\Faker\Generator $faker): void
    {
        $mpIds = $this->ids('matrice_problemes');
        if (empty($mpIds)) {
            return;
        }
        $solutions = [
            'Formation sur les bonnes pratiques agricoles',
            'Distribution de semences améliorées',
            'Construction de magasins de stockage',
            'Mise en place de caisse rurale',
            'Aménagement de bas-fonds',
            'Reboisement communautaire',
            'Formation en transformation alimentaire',
        ];
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $this->ins('matrice_probleme_solutions', [
                'matrice_probleme_id' => $faker->randomElement($mpIds),
                'type'                => $faker->randomElement(self::SOLUTIONS_TYPES),
                'solution'            => $faker->randomElement($solutions),
                'statut'              => $faker->randomElement(self::STATUTS),
            ]);
        }
    }

    private function seedResumeProtocoles(\Faker\Generator $faker): void
    {
        $phIds = $this->ids('profil_historique');
        $mpIds = $this->ids('matrice_problemes');
        $uids  = $this->ids('users');
        if (empty($phIds) || empty($mpIds) || empty($uids)) {
            return;
        }
        $titres = [
            'Test variétal maïs EVDT-97', 'Essai micro-dosage engrais uréé',
            'Protocole zaï amélioré sur mil', 'Comparaison compost vs chimique sur soja',
            'Test semis direct sorgho', 'Expérimentation culture fourragère',
        ];
        $dispositifs = [
            '4 blocs de 5×5 m séparés par des allées de 1 m',
            '3 répétitions avec témoin absolu en bout de parcelle',
            'Split-plot avec 2 facteurs : dose et variété',
        ];
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $this->ins('resume_protocoles_experimentations', [
                'profil_historique_id'    => $faker->randomElement($phIds),
                'matrice_probleme_id'     => $faker->randomElement($mpIds),
                'user_id'                 => $faker->randomElement($uids),
                'titre_experimentation'   => $faker->randomElement($titres),
                'dispositif_experimental' => $faker->randomElement($dispositifs),
                'sujet_special'           => $faker->optional(0.5)->sentence(6),
            ]);
        }
    }

    private function seedCurriculum(\Faker\Generator $faker): void
    {
        $phIds = $this->ids('profil_historique');
        $mpIds = $this->ids('matrice_problemes');
        $uids  = $this->ids('users');
        if (empty($phIds) || empty($mpIds) || empty($uids)) {
            return;
        }
        $activites = [
            'Visite de terrain', 'Formation pratique', 'Séance de démonstration',
            'Réunion de restitution', 'Mise en place parcelle test',
        ];
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $debut = $faker->dateTimeBetween('-2 years', '-6 months');
            $fin   = (clone $debut)->modify('+' . $faker->numberBetween(30, 180) . ' days');
            $this->ins('curriculum_apprentissage_cep', [
                'profil_historique_id'   => $faker->randomElement($phIds),
                'matrice_probleme_id'    => $faker->randomElement($mpIds),
                'user_id'                => $faker->randomElement($uids),
                'option_solution_tester' => $faker->sentence(8),
                'quoi_faire_activite'    => $faker->randomElement($activites),
                'moyens'                 => $faker->optional(0.7)->sentence(6),
                'periode_debut'          => $debut->format('Y-m-d'),
                'periode_fin'            => $fin->format('Y-m-d'),
                'responsable'            => $faker->name(),
            ]);
        }
    }

    private function seedHierarchisationDomaines(\Faker\Generator $faker): void
    {
        $phIds = $this->ids('profil_historique');
        $uids  = $this->ids('users');
        if (empty($phIds) || empty($uids)) {
            return;
        }
        // Contrainte unique (profil_historique_id, domaine_activite)
        foreach (array_slice($faker->shuffle($phIds), 0, min(self::ROWS_LARGE, count($phIds))) as $phId) {
            foreach ($faker->randomElements(self::DOMAINES, $faker->numberBetween(3, 6)) as $rang => $domaine) {
                $this->ins('hierarchisation_domaines_activites', [
                    'profil_historique_id' => $phId,
                    'user_id'              => $faker->randomElement($uids),
                    'domaine_activite'     => $domaine,
                    'score'                => $faker->numberBetween(1, 10),
                    'rang'                 => $rang + 1,
                    'autre_precision'      => null,
                ]);
            }
        }
    }

    private function seedHierarchisationSpeculations(\Faker\Generator $faker): void
    {
        $phIds = $this->ids('profil_historique');
        $uids  = $this->ids('users');
        if (empty($phIds) || empty($uids)) {
            return;
        }
        foreach (array_slice($phIds, 0, min(self::ROWS_LARGE, count($phIds))) as $phId) {
            foreach ($faker->randomElements(self::SPECULATIONS, $faker->numberBetween(3, 6)) as $rang => $spec) {
                $this->ins('hierarchisation_speculations_agricoles', [
                    'profil_historique_id' => $phId,
                    'user_id'              => $faker->randomElement($uids),
                    'domaine_activite'     => 'Agriculture',
                    'speculation_agricole' => $spec,
                    'score'                => $faker->numberBetween(1, 10),
                    'rang'                 => $rang + 1,
                    'autre_precision'      => null,
                ]);
            }
        }
    }

    private function seedBaseBeneficiaires(\Faker\Generator $faker): void
    {
        $uids     = $this->ids('users');
        $partIds  = $this->ids('identification_participants_cep');
        $dids     = $this->ids('departements');
        $comIds   = $this->ids('communes');
        $arrIds   = $this->ids('arrondissements');
        $cepIds   = $this->ids('cep');
        if (empty($uids)) {
            return;
        }
        $typeProd     = ['Bénéficiaire direct', 'Bénéficiaire indirect', 'Leader paysan'];
        $typeParcelle = ['CEP', 'Témoin paysan', 'Parcelle de démonstration'];
        $pratiques    = ['Compostage', 'Rotation culturale', 'Paillage', 'Zaï', 'Demi-lune'];
        for ($i = 0; $i < self::ROWS_LARGE; $i++) {
            $annee = $faker->numberBetween(1955, 2005);
            $this->ins('base_beneficiaires_intervention', [
                'user_id'                           => $faker->randomElement($uids),
                'cep_id'                            => $faker->optional(0.7)->randomElement($cepIds),
                'date_session'                      => $faker->dateTimeBetween('-3 years')->format('Y-m-d'),
                'identification_participant_cep_id' => $faker->optional(0.6)->randomElement($partIds),
                'departement_id'                    => $faker->optional(0.8)->randomElement($dids),
                'commune_id'                        => $faker->optional(0.8)->randomElement($comIds),
                'arrondissement_id'                 => $faker->optional(0.8)->randomElement($arrIds),
                'village'                           => $faker->city(),
                'nom_producteur'                    => $faker->lastName(),
                'prenoms_producteur'                => $faker->firstName(),
                'contact1_producteur'               => $faker->numerify('9########'),
                'contact2_producteur'               => $faker->optional(0.4)->numerify('9########'),
                'sexe'                              => $faker->randomElement(self::SEXES),
                'annee_naissance'                   => $annee,
                'type_producteur'                   => $faker->randomElement($typeProd),
                'type_parcelle'                     => $faker->randomElement($typeParcelle),
                'superficie_totale'                 => $faker->randomFloat(4, 0.25, 10),
                'pratique_agroecologique_1'         => $faker->randomElement($pratiques),
                'pratique_agroecologique_2'         => $faker->optional(0.5)->randomElement($pratiques),
                'pratique_agroecologique_3'         => $faker->optional(0.3)->randomElement($pratiques),
                'coordonnee_x'                      => $faker->randomFloat(7, 0.8, 3.9),
                'coordonnee_y'                      => $faker->randomFloat(7, 6.2, 12.4),
                'culture_principale'                => $faker->randomElement(self::SPECULATIONS),
                'culture_associee'                  => $faker->optional(0.5)->randomElement(self::SPECULATIONS),
            ]);
        }
    }

    private function seedAnimationSessions(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $phIds  = $this->ids('profil_historique');
        $cepIds = $this->ids('cep');
        $rpIds  = $this->ids('resume_protocoles_experimentations');
        if (empty($uids)) {
            return;
        }
        for ($i = 0; $i < self::ROWS_LARGE; $i++) {
            $this->ins('animation_sessions_cep', [
                'user_id'                              => $faker->randomElement($uids),
                'cep_id'                               => $faker->optional(0.7)->randomElement($cepIds),
                'profil_historique_id'                 => $faker->optional(0.7)->randomElement($phIds),
                'date_session'                         => $faker->dateTimeBetween('-3 years')->format('Y-m-d'),
                'resume_protocole_experimentation_id'  => $faker->optional(0.5)->randomElement($rpIds),
                'periode_duree'                        => $faker->numberBetween(1, 8) . ' semaines',
                'superficie_couverte'                  => $faker->randomFloat(4, 0.1, 5),
                'innovations'                          => json_encode($faker->randomElements(self::INNOVATIONS, $faker->numberBetween(1, 4)), JSON_UNESCAPED_UNICODE),
                'appreciation_generale'                => $faker->paragraph(2),
            ]);
        }
    }

    private function seedBilanSessions(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $cepIds = $this->ids('cep');
        if (empty($uids)) {
            return;
        }
        for ($i = 0; $i < self::ROWS_LARGE; $i++) {
            $h = $faker->numberBetween(5, 40);
            $f = $faker->numberBetween(3, 30);
            $j = $faker->numberBetween(0, 10);
            $this->ins('bilan_sessions_animation_cep', [
                'user_id'             => $faker->randomElement($uids),
                'cep_id'              => $faker->optional(0.7)->randomElement($cepIds),
                'date_session'        => $faker->dateTimeBetween('-3 years')->format('Y-m-d'),
                'participation_total' => $h + $f + $j,
                'participation_h'     => $h,
                'participation_f'     => $f,
                'participation_jeunes'=> $j,
                'nb_aaes'             => $faker->numberBetween(0, 5),
                'nb_test_urne'        => $faker->numberBetween(0, 20),
                'sujets_speciaux'     => $faker->optional(0.5)->sentence(8),
                'visiteur_nom'        => $faker->optional(0.3)->name(),
                'visiteur_structure'  => $faker->optional(0.3)->company(),
            ]);
        }
    }

    private function seedOrganisationVisites(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $cepIds = $this->ids('cep');
        if (empty($uids)) {
            return;
        }
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $h = $faker->numberBetween(2, 30);
            $f = $faker->numberBetween(2, 20);
            $j = $faker->numberBetween(0, 10);
            $this->ins('organisation_visites_echanges', [
                'user_id'                   => $faker->randomElement($uids),
                'cep_id'                    => $faker->optional(0.7)->randomElement($cepIds),
                'date'                      => $faker->dateTimeBetween('-3 years')->format('Y-m-d'),
                'lieu_visite'               => $faker->city(),
                'nb_participants'           => $h + $f + $j,
                'participants_hommes'       => $h,
                'participants_femmes'       => $f,
                'participants_jeunes'       => $j,
                'objectifs_visite'          => json_encode(['Observer les expérimentations', 'Partager les bonnes pratiques'], JSON_UNESCAPED_UNICODE),
                'ce_qui_a_marche'           => json_encode(['Bonne organisation', 'Forte participation féminine'], JSON_UNESCAPED_UNICODE),
                'ce_qui_doit_etre_ameliore' => json_encode(['Renforcer le suivi', 'Diversifier les thèmes'], JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    private function seedVisitesCommentees(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $cepIds = $this->ids('cep');
        if (empty($uids)) {
            return;
        }
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $h = $faker->numberBetween(2, 30);
            $f = $faker->numberBetween(2, 20);
            $j = $faker->numberBetween(0, 10);
            $this->ins('visites_echanges_commentees', [
                'user_id'                   => $faker->randomElement($uids),
                'cep_id'                    => $faker->optional(0.7)->randomElement($cepIds),
                'date'                      => $faker->dateTimeBetween('-3 years')->format('Y-m-d'),
                'experimentations_tests'    => json_encode($faker->randomElements(self::INNOVATIONS, 2), JSON_UNESCAPED_UNICODE),
                'visiteurs_total'           => $h + $f + $j,
                'visiteurs_hommes'          => $h,
                'visiteurs_femmes'          => $f,
                'visiteurs_jeunes'          => $j,
                'qui_sont_visiteurs'        => json_encode(['Producteurs voisins', 'Agents agricoles'], JSON_UNESCAPED_UNICODE),
                'ce_qui_a_marche'           => json_encode(['Bonne maîtrise technique', 'Bons rendements'], JSON_UNESCAPED_UNICODE),
                'ce_qui_doit_etre_ameliore' => json_encode(['Documentation', 'Accès intrants'], JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    private function seedRapportDemarrage(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $comIds = $this->ids('communes');
        $cepIds = $this->ids('cep');
        if (empty($uids)) {
            return;
        }
        $deps = ['Borgou', 'Alibori', 'Atlantique', 'Zou', 'Mono', 'Ouémé', 'Plateau', 'Collines'];
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $total  = $faker->numberBetween(10, 50);
            $hommes = (int) ($total * 0.5);
            $femmes = $total - $hommes;
            $this->ins('rapport_demarrage_cep', [
                'user_id'                     => $faker->randomElement($uids),
                'cep_id'                      => $faker->optional(0.7)->randomElement($cepIds),
                'departement'                 => $faker->randomElement($deps),
                'commune_id'                  => $faker->optional(0.8)->randomElement($comIds),
                'facilitateur'                => $faker->name(),
                'structure'                   => $faker->company(),
                'telephone'                   => $faker->numerify('9########'),
                'longitude'                   => (string) $faker->randomFloat(6, 0.8, 3.9),
                'latitude'                    => (string) $faker->randomFloat(6, 6.2, 12.4),
                'beneficiaires_villages'      => $faker->city() . ', ' . $faker->city(),
                'raison_installation'         => $faker->sentence(10),
                'seance_sensibilisation'      => $faker->boolean(),
                'sensibilisation_total'       => $faker->numberBetween(10, 60),
                'sensibilisation_hommes'      => $faker->numberBetween(5, 30),
                'sensibilisation_femmes'      => $faker->numberBetween(5, 30),
                'sensibilisation_autorites'   => $faker->optional(0.5)->sentence(5),
                'enquete_base'                => $faker->boolean(),
                'enquete_nb_seances'          => $faker->numberBetween(1, 5),
                'enquete_total'               => $total,
                'enquete_hommes'              => $hommes,
                'enquete_femmes'              => $femmes,
                'enquete_resultats_restitues' => $faker->boolean(),
                'enquete_details'             => $faker->optional(0.5)->paragraph(2),
                'apprenants_total'            => $total,
                'apprenants_hommes'           => $hommes,
                'apprenants_femmes'           => $femmes,
                'choix_participants'          => $faker->sentence(6),
                'nom_groupe'                  => 'Groupe ' . $faker->word(),
                'slogan_groupe'               => $faker->sentence(5),
                'jour_animation'              => $faker->randomElement(self::JOURS_ANIMATION),
                'constitution_definie'        => $faker->boolean(),
                'sous_groupes'                => $faker->boolean(60),
                'nb_sous_groupes'             => $faker->numberBetween(2, 6),
                'comite_en_place'             => $faker->boolean(70),
                'postes_comite'               => json_encode(['Président', 'Secrétaire', 'Trésorier'], JSON_UNESCAPED_UNICODE),
                'autres_postes'               => $faker->optional(0.3)->sentence(4),
                'site_identifie'              => $faker->boolean(80),
                'statut_site'                 => $faker->randomElement(['Propriété privée', 'Terrain communautaire', 'Domaniaux']),
            ]);
        }
    }

    private function seedRendementDispositif(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $benIds = $this->ids('base_beneficiaires_intervention');
        $comIds = $this->ids('communes');
        $arrIds = $this->ids('arrondissements');
        if (empty($uids)) {
            return;
        }
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $this->ins('rendement_dispositif', [
                'user_id'                       => $faker->randomElement($uids),
                'beneficiaire_id'               => $faker->optional(0.7)->randomElement($benIds),
                'commune_id'                    => $faker->optional(0.8)->randomElement($comIds),
                'arrondissement_id'             => $faker->optional(0.8)->randomElement($arrIds),
                'village'                       => $faker->city(),
                'nom_producteur'                => $faker->name(),
                'culture_technologie'           => $faker->randomElement(self::SPECULATIONS),
                'rendement_annee_n1'            => $faker->randomFloat(2, 0.5, 3.5),
                'rendement_annee_n_technologie' => $faker->randomFloat(2, 1.0, 5.0),
                'rendement_annee_n_temoin'      => $faker->randomFloat(2, 0.5, 3.0),
            ]);
        }
    }

    private function seedEvolutionRendements(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $comIds = $this->ids('communes');
        $arrIds = $this->ids('arrondissements');
        $cepIds = $this->ids('cep');
        if (empty($uids)) {
            return;
        }
        $types = ['CEP test', 'Parcelle témoin', 'Comparaison inter-CEP'];
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $this->ins('evolution_rendements_cep', [
                'user_id'                   => $faker->randomElement($uids),
                'cep_id'                    => $faker->optional(0.7)->randomElement($cepIds),
                'commune_id'                => $faker->optional(0.8)->randomElement($comIds),
                'arrondissement_id'         => $faker->optional(0.8)->randomElement($arrIds),
                'village'                   => $faker->city(),
                'type_experimentation_cep'  => $faker->randomElement($types),
                'culture'                   => $faker->randomElement(self::SPECULATIONS),
                'technologies_dispositif_1' => 'Technologie CEP',
                'technologies_dispositif_2' => 'Témoin paysan',
                'technologies_dispositif_3' => $faker->optional(0.4)->randomElement(['Technologie B', 'Témoin absolu']),
                'technologies_dispositif_4' => null,
                'rendement_dispositif_1'    => $faker->randomFloat(2, 1.0, 5.0),
                'rendement_dispositif_2'    => $faker->randomFloat(2, 0.5, 3.5),
                'rendement_dispositif_3'    => $faker->optional(0.4)->randomFloat(2, 0.5, 4.0),
                'rendement_dispositif_4'    => null,
            ]);
        }
    }

    private function seedAppVersions(\Faker\Generator $faker): void
    {
        $uids = $this->ids('users');
        $vers = [['1.0.0', '1.0.0'], ['1.1.0', '1.1.0'], ['1.2.0', '1.2.0'], ['2.0.0', '2.0.0']];
        foreach ($vers as [$min, $latest]) {
            $this->ins('app_versions', [
                'min_version'    => $min,
                'latest_version' => $latest,
                'force_update'   => false,
                'android_url'    => 'https://play.google.com/store/apps/details?id=bj.pasad',
                'ios_url'        => 'https://apps.apple.com/app/pasad/id123456789',
                'release_notes'  => $faker->sentence(10),
                'published_by'   => $faker->optional(0.7)->randomElement($uids),
            ]);
        }
    }

    // ─── Tables CAI ────────────────────────────────────────────────────────────

    private function seedCaiTables(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $comIds = $this->ids('communes');

        // Tables avec contrainte unique (user_id, commune_id) — 1 seule ligne par paire
        $singleRecord = [
            'cai_facteurs_limitant', 'cai_evaluation_institutionnelle',
            'cai_evaluation_organisationnelle', 'cai_evaluation_sociale',
            'cai_cout_transaction',
        ];
        // Tables simples avec uniquement user_id, commune_id, donnees (pas de contrainte d'unicité)
        $simpleDonnees = [
            'cai_appui_marche', 'cai_programmation_marche', 'cai_programme_quinzaine',
            'cai_journal_caisse', 'cai_fiche_stock', 'cai_evolution_rendements_cep',
            'cai_evolution_rendements_ud', 'cai_evolution_produits_chimiques',
            'cai_evolution_produits_organiques', 'cai_evolution_especes',
            'cai_analyse_qualite_sols',
        ];

        $parametres = ['Prix bord champ', 'Prix marché', 'Coût transport', 'Marge commerçant', 'Quantité disponible'];

        // Single-record tables (contrainte unique user_id + commune_id)
        foreach ($singleRecord as $table) {
            $inserted = 0;
            foreach ($faker->shuffle($uids) as $uid) {
                if ($inserted >= self::ROWS_CAI) {
                    break;
                }
                foreach ($faker->shuffle($comIds) as $cid) {
                    $row = ['user_id' => $uid, 'commune_id' => $cid];
                    if ($table === 'cai_facteurs_limitant') {
                        $row['forces']        = $faker->sentence(6);
                        $row['faiblesses']    = $faker->sentence(6);
                        $row['opportunites']  = $faker->sentence(6);
                        $row['menaces']       = $faker->sentence(6);
                    } else {
                        $row['donnees'] = json_encode($this->caiDonnees($faker), JSON_UNESCAPED_UNICODE);
                    }
                    if ($this->ins($table, $row)) {
                        $inserted++;
                    }
                    if ($inserted >= self::ROWS_CAI) {
                        break;
                    }
                }
            }
        }

        // Tables donnees seulement
        foreach ($simpleDonnees as $table) {
            for ($i = 0; $i < self::ROWS_CAI; $i++) {
                $this->ins($table, [
                    'user_id'    => $faker->randomElement($uids),
                    'commune_id' => $faker->randomElement($comIds),
                    'donnees'    => json_encode($this->caiDonnees($faker), JSON_UNESCAPED_UNICODE),
                ]);
            }
        }

        // Free tables
        $this->seedCaiListeProducteurs($faker, $uids, $comIds);
        $this->seedCaiListeOrganisations($faker, $uids, $comIds);
        $this->seedCaiNegociationAccords($faker, $uids, $comIds);
        $this->seedCaiMarchesCaracterisation($faker, $uids, $comIds);
        $this->seedCaiAgroecologie($faker, $uids, $comIds);

        // Etude de marché
        $this->seedCaiEtudeMarche($faker, $uids, $comIds, $parametres);
    }

    private function seedCaiListeProducteurs(\Faker\Generator $faker, array $uids, array $comIds): void
    {
        for ($i = 0; $i < self::ROWS_CAI; $i++) {
            $this->ins('cai_liste_producteurs', [
                'user_id'                => $faker->randomElement($uids),
                'commune_id'             => $faker->optional(0.9)->randomElement($comIds),
                'nom_prenom'             => $faker->name(),
                'sexe'                   => $faker->randomElement(self::SEXES),
                'age'                    => $faker->numberBetween(18, 75),
                'village'                => $faker->city(),
                'contact'                => $faker->numerify('9########'),
                'op_appartenance'        => $faker->optional(0.7)->company(),
                'produits_agricoles'     => json_encode($faker->randomElements(self::SPECULATIONS, 3), JSON_UNESCAPED_UNICODE),
                'mode_commercialisation' => $faker->randomElement(['Bord champ', 'Marché local', 'Grossiste']),
                'marche_actuel'          => $faker->city(),
                'attentes'               => json_encode(['accompagnement technique', 'accès au crédit'], JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    private function seedCaiListeOrganisations(\Faker\Generator $faker, array $uids, array $comIds): void
    {
        for ($i = 0; $i < self::ROWS_CAI; $i++) {
            $h = $faker->numberBetween(3, 100);
            $f = $faker->numberBetween(2, 80);
            $this->ins('cai_liste_organisations', [
                'user_id'              => $faker->randomElement($uids),
                'commune_id'           => $faker->optional(0.9)->randomElement($comIds),
                'nom_op'               => $faker->company(),
                'siege_contact'        => $faker->city() . ' / ' . $faker->numerify('9########'),
                'numero_groupement'    => (string) $faker->numberBetween(100, 9999),
                'effectif_h'           => $h,
                'effectif_f'           => $f,
                'produits_agricoles'   => json_encode($faker->randomElements(self::SPECULATIONS, 3), JSON_UNESCAPED_UNICODE),
                'mode_commercialisation' => $faker->randomElement(['Bord champ', 'Marché local', 'Grossiste']),
                'marche_actuel'        => $faker->city(),
                'attente'              => json_encode(['formation', 'financement'], JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    private function seedCaiNegociationAccords(\Faker\Generator $faker, array $uids, array $comIds): void
    {
        for ($i = 0; $i < self::ROWS_CAI; $i++) {
            $debut = $faker->dateTimeBetween('-1 year', 'now');
            $fin   = (clone $debut)->modify('+3 months');
            $this->ins('cai_negociation_accords', [
                'user_id'                 => $faker->randomElement($uids),
                'commune_id'              => $faker->optional(0.9)->randomElement($comIds),
                'numero'                  => $faker->numberBetween(1, 99),
                'contraintes_a_lever'     => $faker->sentence(8),
                'activites'               => $faker->sentence(6),
                'responsables'            => json_encode(['conseiller', 'op'], JSON_UNESCAPED_UNICODE),
                'periode_debut'           => $debut->format('Y-m-d'),
                'periode_fin'             => $fin->format('Y-m-d'),
                'moyens_conseiller'       => $faker->sentence(5),
                'moyens_op_exploitation'  => $faker->sentence(5),
            ]);
        }
    }

    private function seedCaiMarchesCaracterisation(\Faker\Generator $faker, array $uids, array $comIds): void
    {
        $types   = ['Marché local', 'Marché régional', 'Marché de collecte', 'Marché frontalier'];
        $routes  = ['Bon état', 'Mauvais état', 'Acceptable', 'Impraticable en saison des pluies'];
        $yesNo   = ['Oui', 'Non', 'Partiellement'];
        for ($i = 0; $i < self::ROWS_CAI; $i++) {
            $this->ins('cai_marches_caracterisation', [
                'user_id'             => $faker->randomElement($uids),
                'commune_id'          => $faker->optional(0.9)->randomElement($comIds),
                'nom_marche'          => 'Marché de ' . $faker->city(),
                'distance'            => $faker->numberBetween(1, 50) . ' km',
                'type_marche'         => $faker->randomElement($types),
                'localisation'        => $faker->city(),
                'frequence_animation' => $faker->randomElement(['Hebdomadaire', 'Bihebdomadaire', 'Mensuel']),
                'etat_route'          => $faker->randomElement($routes),
                'facilite_transport'  => $faker->randomElement($yesNo),
                'cout_transport'      => $faker->numberBetween(500, 5000) . ' FCFA',
                'securite'            => $faker->randomElement(['Bonne', 'Passable', 'Mauvaise']),
                'produits'            => json_encode($faker->randomElements(self::SPECULATIONS, 3), JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    private function seedCaiAgroecologie(\Faker\Generator $faker, array $uids, array $comIds): void
    {
        $deps = ['Borgou', 'Alibori', 'Atlantique', 'Zou', 'Mono', 'Ouémé', 'Plateau', 'Collines'];
        for ($i = 0; $i < self::ROWS_CAI; $i++) {
            $this->ins('cai_agroecologie_producteurs', [
                'user_id'              => $faker->randomElement($uids),
                'commune_id'           => $faker->optional(0.9)->randomElement($comIds),
                'departement'          => $faker->randomElement($deps),
                'commune_nom'          => $faker->city(),
                'arrondissement'       => $faker->city(),
                'village'              => $faker->city(),
                'nom_producteur'       => $faker->lastName(),
                'prenoms_producteur'   => $faker->firstName(),
                'contact1'             => $faker->numerify('9########'),
                'contact2'             => $faker->optional(0.4)->numerify('9########'),
                'sexe'                 => $faker->randomElement(self::SEXES),
                'pratiques'            => json_encode($faker->randomElements(self::INNOVATIONS, 3), JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    private function seedCaiEtudeMarche(\Faker\Generator $faker, array $uids, array $comIds, array $parametres): void
    {
        $categories = ['Production', 'Commercialisation', 'Transformation', 'Prix'];
        $used       = [];
        $n          = 0;
        for ($i = 0; $i < self::ROWS_CAI * 4 && $n < self::ROWS_CAI; $i++) {
            $uid    = $faker->randomElement($uids);
            $cid    = $faker->randomElement($comIds);
            $param  = $faker->randomElement($parametres);
            $key    = "{$uid}_{$cid}_{$param}";
            if (isset($used[$key])) {
                continue;
            }
            $used[$key] = true;
            $n++;
            $this->ins('cai_etude_marche', [
                'user_id'              => $uid,
                'commune_id'           => $cid,
                'categorie'            => $faker->randomElement($categories),
                'parametre'            => $param,
                'tendances_marches'    => json_encode($this->caiDonnees($faker)['items'], JSON_UNESCAPED_UNICODE),
                'situation_exploitation' => json_encode($this->caiDonnees($faker)['items'], JSON_UNESCAPED_UNICODE),
                'ecarts_combler'       => json_encode($this->caiDonnees($faker)['items'], JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    private function seedListePresenceSensibilisation(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $dids   = $this->ids('departements');
        $comIds = $this->ids('communes');
        $arrIds = $this->ids('arrondissements');
        if (empty($uids)) {
            return;
        }
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $this->ins('liste_presence_sensibilisation', [
                'user_id'              => $faker->randomElement($uids),
                'date_session'         => $faker->dateTimeBetween('-3 years')->format('Y-m-d'),
                'departement_id'       => $faker->optional(0.8)->randomElement($dids),
                'commune_id'           => $faker->optional(0.8)->randomElement($comIds),
                'arrondissement_id'    => $faker->optional(0.8)->randomElement($arrIds),
                'village'              => $faker->city(),
                'nom_producteur'       => $faker->lastName(),
                'prenoms_producteur'   => $faker->firstName(),
                'contact1_producteur'  => $faker->optional(0.7)->numerify('9########'),
                'contact2_producteur'  => $faker->optional(0.3)->numerify('9########'),
                'sexe'                 => $faker->randomElement(self::SEXES),
            ]);
        }
    }

    private function seedDifficulteSuggestions(\Faker\Generator $faker): void
    {
        $uids   = $this->ids('users');
        $cepIds = $this->ids('cep');
        if (empty($uids)) {
            return;
        }
        $difficPs = [
            'Manque de semences améliorées', 'Difficulté d\'accès au crédit',
            'Faible encadrement technique', 'Pression parasitaire élevée',
            'Manque d\'eau en saison sèche', 'Mauvais état des pistes',
        ];
        $solutPs = [
            'Formation des producteurs', 'Appui en intrants subventionnés',
            'Mise en place de microcrédit', 'Aménagement de points d\'eau',
        ];
        $suggPs = [
            'Augmenter la fréquence des visites', 'Fournir plus d\'intrants',
            'Organiser des voyages d\'étude', 'Renforcer les capacités des leaders',
        ];
        for ($i = 0; $i < self::ROWS_MEDIUM; $i++) {
            $this->ins('difficultes_suggestions', [
                'user_id'         => $faker->randomElement($uids),
                'cep_id'          => $faker->optional(0.6)->randomElement($cepIds),
                'difficulte'      => $faker->randomElement($difficPs),
                'solution_utilisee' => $faker->randomElement($solutPs),
                'suggestion'      => $faker->randomElement($suggPs),
            ]);
        }
    }

    // ─── Utilitaires ──────────────────────────────────────────────────────────

    /** @return list<int|string> */
    private function ids(string $table): array
    {
        if (! array_key_exists($table, $this->idCache)) {
            $this->idCache[$table] = DB::table($table)->pluck('id')->all();
        }
        return $this->idCache[$table];
    }

    /** @param array<string, mixed> $data */
    private function ins(string $table, array $data): bool
    {
        if (! array_key_exists('created_at', $data)) {
            $data['created_at'] = now();
            $data['updated_at'] = now();
        }
        try {
            DB::table($table)->insert($data);
            return true;
        } catch (QueryException $e) {
            $state = $e->errorInfo[0] ?? '';
            $this->lastErrors[$table] = '[' . $state . '] ' . Str::limit($e->errorInfo[2] ?? $e->getMessage(), 100);
            return false;
        }
    }

    private function caiDonnees(\Faker\Generator $faker): array
    {
        $labels = ['Valeur initiale', 'Valeur actuelle', 'Objectif', 'Réalisé', 'Tendance'];
        $items  = [];
        for ($i = 0, $n = $faker->numberBetween(2, 6); $i < $n; $i++) {
            $items[] = [
                'label'       => $faker->randomElement($labels) . ' ' . ($i + 1),
                'valeur'      => $faker->randomFloat(2, 0, 100),
                'unite'       => $faker->randomElement(['kg/ha', 'FCFA', '%', 'ha', 'personnes']),
                'observation' => $faker->optional(0.5)->sentence(6),
            ];
        }
        return ['items' => $items, 'notes' => $faker->optional(0.3)->paragraph(2)];
    }

    private function printStats(): void
    {
        $tables = DB::select("
            SELECT relname AS t, n_live_tup AS cnt
            FROM pg_stat_user_tables
            WHERE schemaname = 'public' AND n_live_tup > 0
            ORDER BY n_live_tup DESC
        ");
        $rows  = [];
        $total = 0;
        foreach ($tables as $t) {
            $total += $t->cnt;
            $rows[] = [$t->t, number_format($t->cnt, 0, ',', ' ')];
        }
        $this->command?->table(['Table', 'Lignes'], $rows);
        $this->command?->info('Total : ' . number_format($total, 0, ',', ' ') . ' lignes.');
    }
}

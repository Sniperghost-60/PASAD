<?php

namespace Database\Seeders;

use App\Models\Departement;
use App\Models\Commune;
use App\Models\Arrondissement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GeographySeeder extends Seeder
{
    public function run(): void
    {
        DB::table('conseiller_arrondissement')->delete();
        DB::table('conseiller_commune')->delete();
        DB::table('arrondissements')->delete();
        DB::table('communes')->delete();
        DB::table('departements')->delete();

        // Bénin officiel : 12 départements · 77 communes · 438 arrondissements
        $geo = [
            [
                'code' => 'ALI',
                'nom'  => 'Alibori',
                'communes' => [
                    ['Banikoara', ['Banikoara', 'Founougo', 'Gomparou', 'Kokey', 'Kokiborou', 'Ounet', 'Soroko', 'Toura']],
                    ['Gogounou', ['Angaradébou', 'Gogounou', 'Sori', 'Wara', 'Yarakou']],
                    ['Kandi', ['Donwari', 'Kandi', 'Kassakou', 'Saah', 'Sonsoro']],
                    ['Karimama', ['Birni-Lafia', 'Bogo-Bogo', 'Karimama', 'Kompa', 'Monsey']],
                    ['Malanville', ['Garou', 'Guéné', 'Madécali', 'Malanville', 'Momkassa', 'Toumboutou']],
                    ['Ségbana', ['Bensekou', 'Libante', 'Lougou', 'Sampeto', 'Ségbana', 'Sorèkoba']],
                ],
            ],
            [
                'code' => 'ATA',
                'nom'  => 'Atacora',
                'communes' => [
                    ['Boukoumbé', ['Boukoumbé', 'Dipoli', 'Ketchéou', 'Korontière', 'Kossopéré', 'Natta', 'Tabota', 'Wennou']],
                    ['Cobly', ['Cobly', 'Datori', 'Kountouri', 'Tapoga']],
                    ['Kérou', ['Brignamaro', 'Fô-Bouré', 'Kaobagou', 'Kérou', 'Présso']],
                    ['Kouandé', ['Guilmaro', 'Karimé', 'Kouandé', 'Oroukayo', 'Pèpèrèkou', 'Taïacou']],
                    ['Matéri', ['Dassari', 'Kotchakon', 'Matéri', 'Nodi', 'Tantégou']],
                    ['Natitingou', ['Kotopounga', 'Natitingou', 'Perma']],
                    ['Pehunco', ['Gnémasson', 'Pehunco', 'Séké-Tagbé', 'Tobré']],
                    ['Tanguiéta', ['Batia', 'Cantébaou', 'Cotiakou', 'Kouarfa', 'Tanguiéta', 'Tanéka-Koko']],
                    ['Toukountouna', ['Fiérou', 'Toukountouna']],
                ],
            ],
            [
                'code' => 'ATL',
                'nom'  => 'Atlantique',
                'communes' => [
                    ['Abomey-Calavi', ['Abomey-Calavi', 'Akassato', 'Godomey', 'Kpanroun', 'Ouèdo', 'Sékou', 'Togba', 'Zinvié']],
                    ['Allada', ['Allada', 'Attogon', 'Hinvi', 'Kpankou', 'Lissèzoun', 'Lon-Agonmey', 'Sédjè-Dénou', 'Sédjè-Hovè', 'Togoudo']],
                    ['Kpomassè', ['Aholouyèmè', 'Dodji-Bata', 'Kinkinhoué', 'Kpomassè', 'Sègbohouè', 'Tokpa-Domè']],
                    ['Ouidah', ['Avlékété', 'Gakpé', 'Houakpè-Daho', 'Kpomè', 'Loumbou-Loumbou', 'Ouidah I', 'Ouidah II', 'Pahou', 'Savi']],
                    ['Sô-Ava', ['Dékin', 'Ganvié-1', 'Ganvié-2', 'Houédo-Aguékon', 'Ké-Hounli', 'Sô-Ava', 'Vèkky']],
                    ['Toffo', ['Agonlin-Houégbo', 'Colli', 'Cousin', 'Golo-Djigbé', 'Séhoun', 'Toffo']],
                    ['Tori-Bossito', ['Awonou', 'Niaouli', 'Tori-Bossito', 'Tori-Cada', 'Tori-Gare']],
                    ['Zè', ['Dodji-Aliho', 'Djigbé', 'Dovi-Dovè', 'Glo-Djigbé', 'Koundokpoè', 'Sèhouè', 'Tangbo', 'Zè']],
                ],
            ],
            [
                'code' => 'BOR',
                'nom'  => 'Borgou',
                'communes' => [
                    ['Bembèrèkè', ['Bembèrèkè', 'Béroubouay', 'Gamia', 'Ina', 'Korobororou']],
                    ['Kalalé', ['Dérassi', 'Kalalé', 'Liboussou', 'Pèdé', 'Sèkèrè', 'Tchicandou']],
                    ['N\'Dali', ['Bori', 'Gbégourou', 'N\'Dali', 'Ouénou', 'Sérékalé', 'Sinaï']],
                    ['Nikki', ['Biro', 'Dem', 'Gnonkourakali', 'Kaobagou', 'Nikki', 'Suya', 'Tasso']],
                    ['Parakou', ['Parakou I', 'Parakou II', 'Parakou III']],
                    ['Pèrèrè', ['Bétérou', 'Gninsy', 'Guinagourou', 'Pèrèrè']],
                    ['Sinendé', ['Kommon', 'Pédarou', 'Sinendé', 'Toui']],
                    ['Tchaourou', ['Alafiarou', 'Kilibo', 'Kika', 'Sanson', 'Tchatchou', 'Tchaourou']],
                ],
            ],
            [
                'code' => 'COL',
                'nom'  => 'Collines',
                'communes' => [
                    ['Bantè', ['Atokolibé', 'Bantè', 'Challa-Ogoi', 'Gbanlin', 'Koko', 'Pénéssoulou', 'Tchetti']],
                    ['Dassa-Zoumè', ['Dassa-Zoumè', 'Kpingni', 'Kèrè', 'Lèmè', 'Miniffi', 'Ouèdèmè-Djanta', 'Soclogbo', 'Zaffé']],
                    ['Glazoué', ['Assanté', 'Glazoué', 'Gomé', 'Kpakpavissa', 'Magoumi']],
                    ['Ouèssè', ['Kaboua', 'Ouèssè', 'Odo-Otèré', 'Okpèrè', 'Toui']],
                    ['Savalou', ['Agbado', 'Assoli', 'Djaloukou', 'Doumè', 'Kpataba', 'Lahotan', 'Logozohè', 'Monkpa', 'Ottola', 'Savalou']],
                    ['Savè', ['Bessé', 'Odougba', 'Okpara', 'Ouari', 'Savè']],
                ],
            ],
            [
                'code' => 'COU',
                'nom'  => 'Couffo',
                'communes' => [
                    ['Aplahoué', ['Adjamadlan', 'Aplahoué', 'Dèkin', 'Kissèrou', 'Lonkly', 'Totchangni']],
                    ['Djakotomè', ['Adjinagon', 'Djakotomè', 'Kpoba', 'Sè']],
                    ['Dogbo', ['Agatogbo', 'Avedjin', 'Dégbé', 'Dogbo-Tota', 'Madjrè']],
                    ['Klouékanmè', ['Adjamé', 'Gohomey', 'Hlassamè', 'Klouékanmè', 'Kogbodji']],
                    ['Lalo', ['Ahomadégbé', 'Gnizounmè', 'Lalo', 'Lanta', 'Tohou', 'Wono']],
                    ['Toviklin', ['Kinkinhoué', 'Kouti', 'Toviklin']],
                ],
            ],
            [
                'code' => 'DON',
                'nom'  => 'Donga',
                'communes' => [
                    ['Bassila', ['Bassila', 'Dèmè', 'Kodowari', 'Manigri', 'Tchalinga']],
                    ['Copargo', ['Bougou', 'Copargo', 'Pabègou', 'Partago']],
                    ['Djougou', ['Barei', 'Djougou', 'Kolokondé', 'Onklou', 'Pélébina', 'Sérou', 'Sourgounou']],
                    ['Ouaké', ['Bago', 'Kumondè', 'Ouaké', 'Tchoumi-Tchoumi']],
                ],
            ],
            [
                'code' => 'LIT',
                'nom'  => 'Littoral',
                'communes' => [
                    ['Cotonou', ['Cotonou 1er', 'Cotonou 2e', 'Cotonou 3e', 'Cotonou 4e', 'Cotonou 5e', 'Cotonou 6e', 'Cotonou 7e', 'Cotonou 8e', 'Cotonou 9e', 'Cotonou 10e', 'Cotonou 11e', 'Cotonou 12e', 'Cotonou 13e']],
                ],
            ],
            [
                'code' => 'MON',
                'nom'  => 'Mono',
                'communes' => [
                    ['Athiémé', ['Athiémé', 'Diffon', 'Kpinnou', 'Lobogo']],
                    ['Bopa', ['Bopa', 'Dèdèkpoe', 'Gbakpodji', 'Kasséhli', 'Possotomè']],
                    ['Comè', ['Comè', 'Gnizounmè', 'Oumako', 'Ouèdèmè-Adja', 'Ouèdèmè-Pédah']],
                    ['Grand-Popo', ['Agoué', 'Avlo', 'Djanglanmey', 'Grand-Popo', 'Sazué', 'Tokpli']],
                    ['Houéyogbé', ['Dèdèkpahou', 'Dédougou', 'Houéyogbé', 'Kondji', 'Mèdèdjonou']],
                    ['Lokossa', ['Agamè', 'Koudo', 'Lokossa']],
                ],
            ],
            [
                'code' => 'OUE',
                'nom'  => 'Ouémé',
                'communes' => [
                    ['Adjarra', ['Adjarra', 'Aglogbè', 'Médédjonou']],
                    ['Adjohoun', ['Adjohoun', 'Azohouè-Aliho', 'Dèkin', 'Honvié', 'Kpankou', 'Zoungué']],
                    ['Aguégués', ['Aguégués', 'Domè', 'Sô']],
                    ['Akpro-Missèrète', ['Akpro-Missèrète', 'Houédomè', 'Vèkky']],
                    ['Avrankou', ['Avrankou', 'Gbèko', 'Gbozounmè', 'Kpankou', 'Takon']],
                    ['Bonou', ['Atchonsa', 'Bonou', 'Hèvè', 'Kpédékpo']],
                    ['Dangbo', ['Attinnou', 'Dangbo', 'Gbèko-Sota', 'Hékan', 'Mèdédjonou', 'Takon', 'Zounkpa']],
                    ['Porto-Novo', ['Akron', 'Djassin', 'Houinmè', 'Mènontin', 'Oganla', 'Ouando', 'Saint-Jean', 'Tokpota', 'Wèkè']],
                    ['Sèmè-Kpodji', ['Agblangandan', 'Djèrègbé', 'Ekpè', 'Étoilé', 'Kpataloun', 'Kpètèkoudji', 'Sèmè-Kpodji']],
                ],
            ],
            [
                'code' => 'PLA',
                'nom'  => 'Plateau',
                'communes' => [
                    ['Adja-Ouèrè', ['Adja-Ouèrè', 'Igana', 'Kpari', 'Olougbè']],
                    ['Ifangni', ['Daagbé', 'Ifangni', 'Itchèdè', 'Kpankou', 'Okélé']],
                    ['Kétou', ['Adakplamè', 'Atchakpa', 'Idigny', 'Igbo', 'Kétou', 'Okpomèta', 'Oworoko', 'Wari-Maro']],
                    ['Pobè', ['Ahoyéyé', 'Gnèkpè', 'Issaba', 'Kpoulou', 'Pobè', 'Tatonoukon', 'Yoko']],
                    ['Sakété', ['Agbokou', 'Ito', 'Massè', 'Sakété', 'Yokon']],
                ],
            ],
            [
                'code' => 'ZOU',
                'nom'  => 'Zou',
                'communes' => [
                    ['Abomey', ['Abomey', 'Cana', 'Djègbé', 'Hounli', 'Sèhoun']],
                    ['Agbangnizoun', ['Agbangnizoun', 'Domè', 'Gnizounmè', 'Kpakpavissa', 'Kpocodji', 'Tanvè', 'Zounzounmè']],
                    ['Bohicon', ['Bohicon I', 'Bohicon II', 'Détohou', 'Gnidjazoun', 'Lissèzoun', 'Passagon']],
                    ['Covè', ['Agondji', 'Covè', 'Gbodji', 'Gnidjazoun', 'Lissèzoun']],
                    ['Djidja', ['Agouna', 'Djidja', 'Domè', 'Gbèdavo', 'Kpakpavissa', 'Sèhoun', 'Sowè', 'Zounzon']],
                    ['Ouinhi', ['Akiza', 'Hounvèmè', 'Ouinhi', 'Sèmè', 'Tohoues']],
                    ['Zagnanado', ['Dovi', 'Kpèdèkpo', 'Sèmè', 'Tankougnan', 'Zagnanado', 'Zèko']],
                    ['Za-Kpota', ['Akonaboè', 'Kikhia', 'Lissèzoun', 'Za-Kpota', 'Zoukou']],
                    ['Zogbodomey', ['Agongbomè', 'Avogbanna', 'Domè-Glintin', 'Gbèdavo', 'Kpokissa', 'Lissèzoun', 'Massi', 'Zogbodomey']],
                ],
            ],
        ];

        foreach ($geo as $depData) {
            $dep = Departement::create(['code' => $depData['code'], 'nom' => $depData['nom']]);
            foreach ($depData['communes'] as [$comNom, $arrNoms]) {
                $com = Commune::create(['departement_id' => $dep->id, 'nom' => $comNom]);
                foreach ($arrNoms as $arrNom) {
                    Arrondissement::create(['commune_id' => $com->id, 'nom' => $arrNom]);
                }
            }
        }

        $this->command->info('Bénin : 12 départements, 77 communes, 438 arrondissements créés.');
    }
}
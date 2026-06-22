<?php

namespace Database\Seeders;

use App\Models\Departement;
use App\Models\Commune;
use App\Models\Arrondissement;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class GeographySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Département Atlantique
        $atlantique = Departement::create([
            'code' => 'ATL',
            'nom' => 'Atlantique'
        ]);

        $abomeyCalavi = Commune::create([
            'departement_id' => $atlantique->id,
            'nom' => 'Abomey-Calavi'
        ]);

        Arrondissement::create(['commune_id' => $abomeyCalavi->id, 'nom' => 'Akassato']);
        Arrondissement::create(['commune_id' => $abomeyCalavi->id, 'nom' => 'Godomey']);
        Arrondissement::create(['commune_id' => $abomeyCalavi->id, 'nom' => 'Togba']);

        $allada = Commune::create([
            'departement_id' => $atlantique->id,
            'nom' => 'Allada'
        ]);

        Arrondissement::create(['commune_id' => $allada->id, 'nom' => 'Allada']);
        Arrondissement::create(['commune_id' => $allada->id, 'nom' => 'Attogon']);
        Arrondissement::create(['commune_id' => $allada->id, 'nom' => 'Hinvi']);

        $ouidah = Commune::create([
            'departement_id' => $atlantique->id,
            'nom' => 'Ouidah'
        ]);

        Arrondissement::create(['commune_id' => $ouidah->id, 'nom' => 'Ouidah I']);
        Arrondissement::create(['commune_id' => $ouidah->id, 'nom' => 'Ouidah II']);
        Arrondissement::create(['commune_id' => $ouidah->id, 'nom' => 'Savi']);

        // Département Littoral
        $littoral = Departement::create([
            'code' => 'LIT',
            'nom' => 'Littoral'
        ]);

        $cotonou = Commune::create([
            'departement_id' => $littoral->id,
            'nom' => 'Cotonou'
        ]);

        for ($i = 1; $i <= 13; $i++) {
            Arrondissement::create([
                'commune_id' => $cotonou->id,
                'nom' => "Arrondissement {$i}"
            ]);
        }

        // Département Ouémé
        $oueme = Departement::create([
            'code' => 'OUE',
            'nom' => 'Ouémé'
        ]);

        $portoNovo = Commune::create([
            'departement_id' => $oueme->id,
            'nom' => 'Porto-Novo'
        ]);

        Arrondissement::create(['commune_id' => $portoNovo->id, 'nom' => 'Akron']);
        Arrondissement::create(['commune_id' => $portoNovo->id, 'nom' => 'Djassin']);
        Arrondissement::create(['commune_id' => $portoNovo->id, 'nom' => 'Houinmè']);

        $adjarra = Commune::create([
            'departement_id' => $oueme->id,
            'nom' => 'Adjarra'
        ]);

        Arrondissement::create(['commune_id' => $adjarra->id, 'nom' => 'Adjarra']);
        Arrondissement::create(['commune_id' => $adjarra->id, 'nom' => 'Aglogbè']);
        Arrondissement::create(['commune_id' => $adjarra->id, 'nom' => 'Médédjonou']);

        $this->command->info('Données géographiques créées avec succès!');
    }
}

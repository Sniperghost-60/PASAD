<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'hierarchisation_domaines_activites',
        'hierarchisation_speculations_agricoles',
        'matrice_problemes',
        'curriculum_apprentissage_cep',
        'resume_protocoles_experimentations',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $tbl) {
            Schema::table($tbl, function (Blueprint $table) {
                $table->foreignId('commune_id')
                      ->nullable()
                      ->after('profil_historique_id')
                      ->constrained('communes')
                      ->nullOnDelete();
            });
        }

        // Backfill depuis profil_historique.commune_id (syntaxe PostgreSQL)
        foreach (self::TABLES as $tbl) {
            DB::statement("
                UPDATE {$tbl}
                SET commune_id = ph.commune_id
                FROM profil_historique ph
                WHERE ph.id = {$tbl}.profil_historique_id
                  AND {$tbl}.commune_id IS NULL
            ");
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $tbl) {
            Schema::table($tbl, function (Blueprint $table) {
                $table->dropForeign(['commune_id']);
                $table->dropColumn('commune_id');
            });
        }
    }
};

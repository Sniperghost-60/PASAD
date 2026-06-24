<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'animation_sessions_cep',
        'bilan_sessions_animation_cep',
        'base_beneficiaires_intervention',
        'organisation_visites_echanges',
        'visites_echanges_commentees',
        'difficultes_suggestions',
        'evolution_rendements_cep',
        'rendement_dispositif',
        'rapport_demarrage_cep',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('cep_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('cep')
                  ->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropForeign(['cep_id']);
                $t->dropColumn('cep_id');
            });
        }
    }
};

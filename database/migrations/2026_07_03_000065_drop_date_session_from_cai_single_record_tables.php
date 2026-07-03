<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'cai_analyse_qualite_sols',
        'cai_appui_marche',
        'cai_cout_transaction',
        'cai_evaluation_institutionnelle',
        'cai_evaluation_organisationnelle',
        'cai_evaluation_sociale',
        'cai_evolution_especes',
        'cai_evolution_produits_chimiques',
        'cai_evolution_produits_organiques',
        'cai_evolution_rendements_cep',
        'cai_evolution_rendements_ud',
        'cai_fiche_stock',
        'cai_journal_caisse',
        'cai_programmation_marche',
        'cai_programme_quinzaine',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropUnique(['user_id', 'commune_id', 'date_session']);
                $t->dropColumn('date_session');
            });
        }

        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->unique(['user_id', 'commune_id']);
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropUnique(['user_id', 'commune_id']);
                $t->date('date_session')->nullable();
            });
        }

        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->unique(['user_id', 'commune_id', 'date_session']);
            });
        }
    }
};

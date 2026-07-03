<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rendement_dispositif', function (Blueprint $table) {
            $table->dropForeign(['cep_id']);
            $table->dropColumn('cep_id');
            $table->foreignId('beneficiaire_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('base_beneficiaires_intervention')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('rendement_dispositif', function (Blueprint $table) {
            $table->dropForeign(['beneficiaire_id']);
            $table->dropColumn('beneficiaire_id');
            $table->foreignId('cep_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('cep')
                  ->onDelete('set null');
        });
    }
};

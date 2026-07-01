<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_evolution_rendements_cep', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            // { lignes: [{commune, arrondissement, village, type_experimentation, culture, rendement_d1, rendement_d2, rendement_d3, rendement_d4}] }
            $table->json('donnees')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'commune_id', 'date_session']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_evolution_rendements_cep');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_evolution_rendements_ud', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            // { lignes: [{commune, arrondissement, village, nom_producteur, culture_technologie, rendement_n1, rendement_n_technologie, rendement_n_temoin}] }
            $table->json('donnees')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'commune_id', 'date_session']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_evolution_rendements_ud');
    }
};

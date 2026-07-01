<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_evolution_especes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            // { lignes_animale: [{commune, arrondissement, village, nom_producteur, especes,
            //                     identite_espece, nb_n1, nb_n, nb_n_plus1, observations}],
            //   lignes_vegetale: [...] }
            $table->json('donnees')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'commune_id', 'date_session']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_evolution_especes');
    }
};

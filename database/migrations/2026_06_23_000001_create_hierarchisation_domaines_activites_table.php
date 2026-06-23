<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('hierarchisation_domaines_activites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profil_historique_id')->constrained('profil_historique')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('domaine_activite');
            $table->unsignedInteger('score')->nullable();
            $table->unsignedInteger('rang')->nullable();
            $table->string('autre_precision')->nullable();
            $table->timestamps();

            $table->unique(['profil_historique_id', 'domaine_activite']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hierarchisation_domaines_activites');
    }
};

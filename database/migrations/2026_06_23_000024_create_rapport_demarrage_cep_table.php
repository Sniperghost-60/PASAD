<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rapport_demarrage_cep', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // En-tête
            $table->string('departement')->nullable();
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->string('facilitateur')->nullable();
            $table->string('structure')->nullable();
            $table->string('telephone')->nullable();
            $table->string('longitude')->nullable();
            $table->string('latitude')->nullable();

            // 1. Activités préliminaires
            $table->text('beneficiaires_villages')->nullable();
            $table->text('raison_installation')->nullable();

            // Séance sensibilisation
            $table->boolean('seance_sensibilisation')->nullable();
            $table->smallInteger('sensibilisation_total')->nullable();
            $table->smallInteger('sensibilisation_hommes')->nullable();
            $table->smallInteger('sensibilisation_femmes')->nullable();
            $table->text('sensibilisation_autorites')->nullable();

            // Enquête de base
            $table->boolean('enquete_base')->nullable();
            $table->smallInteger('enquete_nb_seances')->nullable();
            $table->smallInteger('enquete_total')->nullable();
            $table->smallInteger('enquete_hommes')->nullable();
            $table->smallInteger('enquete_femmes')->nullable();
            $table->boolean('enquete_resultats_restitues')->nullable();
            $table->text('enquete_details')->nullable();

            // Apprenants & groupe
            $table->smallInteger('apprenants_total')->nullable();
            $table->smallInteger('apprenants_hommes')->nullable();
            $table->smallInteger('apprenants_femmes')->nullable();
            $table->text('choix_participants')->nullable();
            $table->string('nom_groupe')->nullable();
            $table->string('slogan_groupe')->nullable();
            $table->string('jour_animation')->nullable();
            $table->boolean('constitution_definie')->nullable();
            $table->boolean('sous_groupes')->nullable();
            $table->smallInteger('nb_sous_groupes')->nullable();
            $table->boolean('comite_en_place')->nullable();
            $table->jsonb('postes_comite')->nullable();
            $table->text('autres_postes')->nullable();

            // Site
            $table->boolean('site_identifie')->nullable();
            $table->string('statut_site')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rapport_demarrage_cep');
    }
};

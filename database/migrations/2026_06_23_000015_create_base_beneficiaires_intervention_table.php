<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('base_beneficiaires_intervention', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date_session')->nullable();
            $table->foreignId('identification_participant_cep_id')
                  ->nullable()
                  ->constrained('identification_participants_cep')
                  ->onDelete('set null');
            $table->foreignId('departement_id')->nullable()->constrained('departements')->onDelete('set null');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->foreignId('arrondissement_id')->nullable()->constrained('arrondissements')->onDelete('set null');
            $table->string('village')->nullable();
            $table->string('nom_producteur');
            $table->string('prenoms_producteur')->nullable();
            $table->string('contact1_producteur')->nullable();
            $table->string('contact2_producteur')->nullable();
            $table->enum('sexe', ['M', 'F']);
            $table->smallInteger('annee_naissance')->nullable();
            $table->string('type_producteur')->nullable();
            $table->string('type_parcelle')->nullable();
            $table->decimal('superficie_totale', 10, 4)->nullable();
            $table->string('pratique_agroecologique_1')->nullable();
            $table->string('pratique_agroecologique_2')->nullable();
            $table->string('pratique_agroecologique_3')->nullable();
            $table->decimal('coordonnee_x', 12, 7)->nullable();
            $table->decimal('coordonnee_y', 12, 7)->nullable();
            $table->string('culture_principale')->nullable();
            $table->string('culture_associee')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('base_beneficiaires_intervention');
    }
};

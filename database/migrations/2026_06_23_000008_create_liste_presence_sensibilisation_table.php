<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liste_presence_sensibilisation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date_session')->nullable();
            $table->foreignId('departement_id')->nullable()->constrained('departements')->onDelete('set null');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->foreignId('arrondissement_id')->nullable()->constrained('arrondissements')->onDelete('set null');
            $table->string('village')->nullable();
            $table->string('nom_producteur');
            $table->string('prenoms_producteur')->nullable();
            $table->string('contact1_producteur')->nullable();
            $table->string('contact2_producteur')->nullable();
            $table->enum('sexe', ['M', 'F']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liste_presence_sensibilisation');
    }
};

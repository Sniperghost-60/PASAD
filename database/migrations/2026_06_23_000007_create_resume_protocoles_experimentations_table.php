<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resume_protocoles_experimentations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profil_historique_id')->constrained('profil_historique')->onDelete('cascade');
            $table->foreignId('matrice_probleme_id')->constrained('matrice_problemes')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('titre_experimentation');
            $table->text('dispositif_experimental')->nullable();
            $table->text('sujet_special')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resume_protocoles_experimentations');
    }
};

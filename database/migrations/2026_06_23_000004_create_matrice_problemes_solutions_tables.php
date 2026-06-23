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
        Schema::create('matrice_problemes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profil_historique_id')->constrained('profil_historique')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('probleme');
            $table->text('causes')->nullable();
            $table->timestamps();
        });

        Schema::create('matrice_probleme_solutions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('matrice_probleme_id')->constrained('matrice_problemes')->onDelete('cascade');
            $table->string('type');
            $table->text('solution');
            $table->string('statut')->default('en_attente');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matrice_probleme_solutions');
        Schema::dropIfExists('matrice_problemes');
    }
};

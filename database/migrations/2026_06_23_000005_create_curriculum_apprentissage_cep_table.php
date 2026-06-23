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
        if (! Schema::hasColumn('matrice_problemes', 'est_pertinent')) {
            Schema::table('matrice_problemes', function (Blueprint $table) {
                $table->boolean('est_pertinent')->default(false);
            });
        }

        Schema::create('curriculum_apprentissage_cep', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profil_historique_id')->constrained('profil_historique')->onDelete('cascade');
            $table->foreignId('matrice_probleme_id')->constrained('matrice_problemes')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('option_solution_tester');
            $table->text('quoi_faire_activite');
            $table->text('moyens')->nullable();
            $table->date('periode_debut')->nullable();
            $table->date('periode_fin')->nullable();
            $table->string('responsable')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curriculum_apprentissage_cep');

        if (Schema::hasColumn('matrice_problemes', 'est_pertinent')) {
            Schema::table('matrice_problemes', function (Blueprint $table) {
                $table->dropColumn('est_pertinent');
            });
        }
    }
};

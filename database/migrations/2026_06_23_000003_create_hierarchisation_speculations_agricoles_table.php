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
        Schema::create('hierarchisation_speculations_agricoles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profil_historique_id')->constrained('profil_historique')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('domaine_activite')->default('Agriculture');
            $table->string('speculation_agricole');
            $table->unsignedInteger('score')->nullable();
            $table->unsignedInteger('rang')->nullable();
            $table->string('autre_precision')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hierarchisation_speculations_agricoles');
    }
};

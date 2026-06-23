<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rendement_dispositif', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->foreignId('arrondissement_id')->nullable()->constrained('arrondissements')->onDelete('set null');
            $table->string('village')->nullable();
            $table->string('nom_producteur')->nullable();
            $table->string('culture_technologie')->nullable();
            $table->decimal('rendement_annee_n1', 10, 4)->nullable();
            $table->decimal('rendement_annee_n_technologie', 10, 4)->nullable();
            $table->decimal('rendement_annee_n_temoin', 10, 4)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rendement_dispositif');
    }
};

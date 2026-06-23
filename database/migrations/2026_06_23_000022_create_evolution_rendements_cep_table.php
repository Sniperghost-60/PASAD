<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evolution_rendements_cep', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->foreignId('arrondissement_id')->nullable()->constrained('arrondissements')->onDelete('set null');
            $table->string('village')->nullable();
            $table->string('type_experimentation_cep')->nullable();
            $table->string('culture')->nullable();
            $table->string('technologies_dispositif_1')->nullable();
            $table->string('technologies_dispositif_2')->nullable();
            $table->string('technologies_dispositif_3')->nullable();
            $table->string('technologies_dispositif_4')->nullable();
            $table->decimal('rendement_dispositif_1', 10, 4)->nullable();
            $table->decimal('rendement_dispositif_2', 10, 4)->nullable();
            $table->decimal('rendement_dispositif_3', 10, 4)->nullable();
            $table->decimal('rendement_dispositif_4', 10, 4)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evolution_rendements_cep');
    }
};

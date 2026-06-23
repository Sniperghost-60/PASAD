<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visites_echanges_commentees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date')->nullable();
            $table->jsonb('experimentations_tests')->nullable();
            $table->smallInteger('visiteurs_total')->nullable();
            $table->smallInteger('visiteurs_hommes')->nullable();
            $table->smallInteger('visiteurs_femmes')->nullable();
            $table->jsonb('qui_sont_visiteurs')->nullable();
            $table->jsonb('ce_qui_a_marche')->nullable();
            $table->jsonb('ce_qui_doit_etre_ameliore')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visites_echanges_commentees');
    }
};

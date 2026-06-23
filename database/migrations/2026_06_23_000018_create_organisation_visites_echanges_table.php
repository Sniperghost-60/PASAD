<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organisation_visites_echanges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date')->nullable();
            $table->string('lieu_visite')->nullable();
            $table->smallInteger('nb_participants')->nullable();
            $table->text('objectifs_visite')->nullable();
            $table->text('ce_qui_a_marche')->nullable();
            $table->text('ce_qui_doit_etre_ameliore')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organisation_visites_echanges');
    }
};

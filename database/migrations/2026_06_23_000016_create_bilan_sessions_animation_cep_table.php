<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bilan_sessions_animation_cep', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date_session')->nullable();
            $table->smallInteger('participation_total')->nullable();
            $table->smallInteger('participation_h')->nullable();
            $table->smallInteger('participation_f_jeunes')->nullable();
            $table->smallInteger('nb_aaes')->nullable();
            $table->smallInteger('nb_test_urne')->nullable();
            $table->text('sujets_speciaux')->nullable();
            $table->string('visiteur_nom')->nullable();
            $table->string('visiteur_structure')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bilan_sessions_animation_cep');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_liste_producteurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            $table->string('nom_prenom');
            $table->enum('sexe', ['M', 'F']);
            $table->smallInteger('age')->nullable();
            $table->string('village')->nullable();
            $table->string('contact')->nullable();
            $table->string('op_appartenance')->nullable();
            $table->jsonb('produits_agricoles')->nullable();
            $table->string('mode_commercialisation')->nullable();
            $table->string('marche_actuel')->nullable();
            $table->text('attentes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_liste_producteurs');
    }
};

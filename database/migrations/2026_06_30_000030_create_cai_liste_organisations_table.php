<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_liste_organisations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            $table->string('nom_op');
            $table->string('siege_contact')->nullable();
            $table->string('numero_groupement')->nullable();
            $table->unsignedSmallInteger('effectif_h')->nullable();
            $table->unsignedSmallInteger('effectif_f')->nullable();
            $table->jsonb('produits_agricoles')->nullable();
            $table->string('mode_commercialisation')->nullable();
            $table->string('marche_actuel')->nullable();
            $table->text('attente')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_liste_organisations');
    }
};

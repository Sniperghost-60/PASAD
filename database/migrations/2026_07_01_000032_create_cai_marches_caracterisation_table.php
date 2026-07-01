<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_marches_caracterisation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            $table->string('nom_marche');
            $table->string('distance')->nullable();
            $table->string('type_marche')->nullable();
            $table->string('localisation')->nullable();
            $table->string('frequence_animation')->nullable();
            $table->string('etat_route')->nullable();
            $table->string('facilite_transport')->nullable();
            $table->string('cout_transport')->nullable();
            $table->string('securite')->nullable();
            $table->jsonb('produits')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_marches_caracterisation');
    }
};

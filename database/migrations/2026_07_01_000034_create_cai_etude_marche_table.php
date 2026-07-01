<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_etude_marche', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            $table->string('categorie');   // produit | promotion_commercialisation | liens_affaire
            $table->string('parametre');   // slug du paramètre (ex: nature_produit)
            $table->text('tendances_marches')->nullable();
            $table->text('situation_exploitation')->nullable();
            $table->text('ecarts_combler')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'commune_id', 'date_session', 'parametre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_etude_marche');
    }
};

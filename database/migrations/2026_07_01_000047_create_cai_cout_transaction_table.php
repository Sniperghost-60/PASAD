<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_cout_transaction', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            // { marches: { m1: { pre_transformation, transport, emballage, entreposage,
            //   produits_conservation, interets_commercialisation, amortissement,
            //   interets_investissement, inspection_conseil, taxes_marche, intermediaires,
            //   promotion_publicite, pertes, prix_kg, cout_transaction, produit_brut }, m2: {…}, m3: {…} } }
            $table->json('donnees')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'commune_id', 'date_session']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_cout_transaction');
    }
};

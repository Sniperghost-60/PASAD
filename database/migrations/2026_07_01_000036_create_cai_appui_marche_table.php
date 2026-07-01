<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_appui_marche', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            // { marche1: { pretransformation: 0, ..., produit_brut: 0 }, marche2: {...}, marche3: {...} }
            $table->json('donnees')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'commune_id', 'date_session']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_appui_marche');
    }
};

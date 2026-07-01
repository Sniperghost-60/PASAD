<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_agroecologie_producteurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            $table->string('departement')->nullable();
            $table->string('commune_nom')->nullable();
            $table->string('arrondissement')->nullable();
            $table->string('village')->nullable();
            $table->string('nom_producteur')->nullable();
            $table->string('prenoms_producteur')->nullable();
            $table->string('contact1')->nullable();
            $table->string('contact2')->nullable();
            $table->string('sexe', 1)->nullable(); // M / F
            $table->json('pratiques')->nullable();  // { slug: bool, … }
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_agroecologie_producteurs');
    }
};

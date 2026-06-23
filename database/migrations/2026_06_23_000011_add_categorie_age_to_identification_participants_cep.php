<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('identification_participants_cep', function (Blueprint $table) {
            $table->enum('categorie_age', ['J', 'A', 'V'])->nullable()->after('annee_naissance');
        });
    }

    public function down(): void
    {
        Schema::table('identification_participants_cep', function (Blueprint $table) {
            $table->dropColumn('categorie_age');
        });
    }
};

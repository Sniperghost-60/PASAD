<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('matrice_problemes', 'est_pertinent')) {
            Schema::table('matrice_problemes', function (Blueprint $table) {
                $table->boolean('est_pertinent')->default(false);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('matrice_problemes', 'est_pertinent')) {
            Schema::table('matrice_problemes', function (Blueprint $table) {
                $table->dropColumn('est_pertinent');
            });
        }
    }
};

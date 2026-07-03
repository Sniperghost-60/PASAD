<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visites_echanges_commentees', function (Blueprint $table) {
            $table->smallInteger('visiteurs_jeunes')->nullable()->after('visiteurs_femmes');
        });
    }

    public function down(): void
    {
        Schema::table('visites_echanges_commentees', function (Blueprint $table) {
            $table->dropColumn('visiteurs_jeunes');
        });
    }
};

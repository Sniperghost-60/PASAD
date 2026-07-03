<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organisation_visites_echanges', function (Blueprint $table) {
            $table->smallInteger('participants_hommes')->nullable()->after('nb_participants');
            $table->smallInteger('participants_femmes')->nullable()->after('participants_hommes');
            $table->smallInteger('participants_jeunes')->nullable()->after('participants_femmes');
        });
    }

    public function down(): void
    {
        Schema::table('organisation_visites_echanges', function (Blueprint $table) {
            $table->dropColumn(['participants_hommes', 'participants_femmes', 'participants_jeunes']);
        });
    }
};

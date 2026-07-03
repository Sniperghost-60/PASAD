<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cai_etude_marche', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'commune_id', 'date_session', 'parametre']);
            $table->dropColumn('date_session');
        });

        Schema::table('cai_etude_marche', function (Blueprint $table) {
            $table->unique(['user_id', 'commune_id', 'parametre']);
        });
    }

    public function down(): void
    {
        Schema::table('cai_etude_marche', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'commune_id', 'parametre']);
            $table->date('date_session')->nullable();
        });

        Schema::table('cai_etude_marche', function (Blueprint $table) {
            $table->unique(['user_id', 'commune_id', 'date_session', 'parametre']);
        });
    }
};

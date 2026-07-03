<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cai_facteurs_limitant', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'commune_id', 'date_session']);
            $table->dropColumn('date_session');
        });

        Schema::table('cai_facteurs_limitant', function (Blueprint $table) {
            $table->unique(['user_id', 'commune_id']);
        });
    }

    public function down(): void
    {
        Schema::table('cai_facteurs_limitant', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'commune_id']);
            $table->date('date_session')->nullable();
        });

        Schema::table('cai_facteurs_limitant', function (Blueprint $table) {
            $table->unique(['user_id', 'commune_id', 'date_session']);
        });
    }
};

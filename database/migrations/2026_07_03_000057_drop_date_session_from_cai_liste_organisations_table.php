<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cai_liste_organisations', function (Blueprint $table) {
            $table->dropColumn('date_session');
        });
    }

    public function down(): void
    {
        Schema::table('cai_liste_organisations', function (Blueprint $table) {
            $table->date('date_session')->nullable();
        });
    }
};

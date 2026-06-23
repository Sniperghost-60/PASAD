<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bilan_sessions_animation_cep', function (Blueprint $table) {
            $table->renameColumn('participation_f_jeunes', 'participation_f');
        });

        Schema::table('bilan_sessions_animation_cep', function (Blueprint $table) {
            $table->smallInteger('participation_jeunes')->nullable()->after('participation_f');
        });
    }

    public function down(): void
    {
        Schema::table('bilan_sessions_animation_cep', function (Blueprint $table) {
            $table->dropColumn('participation_jeunes');
        });

        Schema::table('bilan_sessions_animation_cep', function (Blueprint $table) {
            $table->renameColumn('participation_f', 'participation_f_jeunes');
        });
    }
};

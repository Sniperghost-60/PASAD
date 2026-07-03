<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cai_negociation_accords', function (Blueprint $table) {
            $table->date('periode_debut')->nullable()->after('periode_execution');
            $table->date('periode_fin')->nullable()->after('periode_debut');
        });

        Schema::table('cai_negociation_accords', function (Blueprint $table) {
            $table->dropColumn('periode_execution');
        });
    }

    public function down(): void
    {
        Schema::table('cai_negociation_accords', function (Blueprint $table) {
            $table->string('periode_execution')->nullable();
        });

        Schema::table('cai_negociation_accords', function (Blueprint $table) {
            $table->dropColumn(['periode_debut', 'periode_fin']);
        });
    }
};

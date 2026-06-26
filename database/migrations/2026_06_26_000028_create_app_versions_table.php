<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_versions', function (Blueprint $table) {
            $table->id();
            $table->string('min_version', 20)->comment('Version minimale requise pour utiliser l\'app (ex: 1.2.0)');
            $table->string('latest_version', 20)->comment('Dernière version disponible (informatif)');
            $table->boolean('force_update')->default(false)->comment('Bloquer complètement les anciennes versions');
            $table->string('android_url', 500)->nullable()->comment('Lien Play Store');
            $table->string('ios_url', 500)->nullable()->comment('Lien App Store');
            $table->text('release_notes')->nullable()->comment('Notes de mise à jour affichées à l\'utilisateur');
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Enregistrement initial — version 1.0.0 (l'app actuelle), aucune mise à jour forcée
        DB::table('app_versions')->insert([
            'min_version'    => '1.0.0',
            'latest_version' => '1.0.0',
            'force_update'   => false,
            'android_url'    => null,
            'ios_url'        => null,
            'release_notes'  => null,
            'published_by'   => null,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('app_versions');
    }
};

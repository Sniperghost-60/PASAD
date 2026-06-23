<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('animation_sessions_cep', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('profil_historique_id')
                  ->nullable()
                  ->constrained('profil_historique')
                  ->onDelete('set null');
            $table->date('date_session')->nullable();
            $table->foreignId('resume_protocole_experimentation_id')
                  ->nullable()
                  ->constrained('resume_protocoles_experimentations')
                  ->onDelete('set null');
            $table->string('periode_duree')->nullable();
            $table->decimal('superficie_couverte', 10, 4)->nullable();
            $table->jsonb('innovations')->nullable();
            $table->text('appreciation_generale')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animation_sessions_cep');
    }
};

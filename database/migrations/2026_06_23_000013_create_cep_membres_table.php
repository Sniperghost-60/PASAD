<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cep_membres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cep_id')
                  ->constrained('cep')
                  ->onDelete('cascade');
            $table->foreignId('identification_participant_cep_id')
                  ->constrained('identification_participants_cep')
                  ->onDelete('cascade');
            $table->string('responsabilite')->nullable();
            $table->timestamps();

            // Un participant ne peut appartenir qu'à un seul CEP
            $table->unique('identification_participant_cep_id', 'unique_participant_cep');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cep_membres');
    }
};

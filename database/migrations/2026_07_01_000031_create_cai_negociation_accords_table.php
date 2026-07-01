<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cai_negociation_accords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            $table->date('date_session')->nullable();
            $table->unsignedSmallInteger('numero')->nullable();
            $table->text('contraintes_a_lever')->nullable();
            $table->text('activites')->nullable();
            $table->string('responsables')->nullable();
            $table->string('periode_execution')->nullable();
            $table->string('moyens_conseiller')->nullable();
            $table->string('moyens_op_exploitation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cai_negociation_accords');
    }
};

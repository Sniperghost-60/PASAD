<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_exports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('scope', 20);
            $table->string('selection');
            $table->string('format', 10);
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->string('disk')->default('local');
            $table->string('path')->nullable();
            $table->string('filename')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_exports');
    }
};

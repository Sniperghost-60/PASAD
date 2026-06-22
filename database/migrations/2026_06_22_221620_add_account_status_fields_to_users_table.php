<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_blocked')->default(false)->after('password');
            $table->boolean('is_suspended')->default(false)->after('is_blocked');
            $table->boolean('is_frozen')->default(false)->after('is_suspended');
            $table->timestamp('blocked_at')->nullable()->after('is_frozen');
            $table->timestamp('suspended_at')->nullable()->after('blocked_at');
            $table->timestamp('frozen_at')->nullable()->after('suspended_at');
            $table->string('blocked_reason')->nullable()->after('frozen_at');
            $table->string('suspended_reason')->nullable()->after('blocked_reason');
            $table->string('frozen_reason')->nullable()->after('suspended_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'is_blocked',
                'is_suspended',
                'is_frozen',
                'blocked_at',
                'suspended_at',
                'frozen_at',
                'blocked_reason',
                'suspended_reason',
                'frozen_reason',
            ]);
        });
    }
};

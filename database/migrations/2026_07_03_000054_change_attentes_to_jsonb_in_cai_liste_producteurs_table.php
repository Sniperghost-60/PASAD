<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE cai_liste_producteurs
            ALTER COLUMN attentes TYPE jsonb
            USING CASE
                WHEN attentes IS NULL OR attentes = '' THEN NULL
                ELSE jsonb_build_array(attentes)
            END
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE cai_liste_producteurs
            ALTER COLUMN attentes TYPE text
            USING CASE
                WHEN attentes IS NULL THEN NULL
                ELSE (SELECT string_agg(value, ', ') FROM jsonb_array_elements_text(attentes))
            END
        ");
    }
};

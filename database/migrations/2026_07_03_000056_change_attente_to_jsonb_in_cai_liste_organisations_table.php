<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE cai_liste_organisations
            ALTER COLUMN attente TYPE jsonb
            USING CASE
                WHEN attente IS NULL OR attente = '' THEN NULL
                ELSE jsonb_build_array(attente)
            END
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE cai_liste_organisations
            ALTER COLUMN attente TYPE text
            USING CASE
                WHEN attente IS NULL THEN NULL
                ELSE (SELECT string_agg(value, ', ') FROM jsonb_array_elements_text(attente))
            END
        ");
    }
};

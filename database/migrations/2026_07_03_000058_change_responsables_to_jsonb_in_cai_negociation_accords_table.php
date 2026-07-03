<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE cai_negociation_accords
            ALTER COLUMN responsables TYPE jsonb
            USING CASE
                WHEN responsables IS NULL OR responsables = '' THEN NULL
                ELSE jsonb_build_array(responsables)
            END
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE cai_negociation_accords
            ALTER COLUMN responsables TYPE varchar(255)
            USING CASE
                WHEN responsables IS NULL THEN NULL
                ELSE (SELECT string_agg(value, ', ') FROM jsonb_array_elements_text(responsables))
            END
        ");
    }
};

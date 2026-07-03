<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $columns = ['tendances_marches', 'situation_exploitation', 'ecarts_combler'];

    public function up(): void
    {
        foreach ($this->columns as $column) {
            DB::statement("
                ALTER TABLE cai_etude_marche
                ALTER COLUMN {$column} TYPE jsonb
                USING CASE WHEN {$column} IS NULL OR {$column} = '' THEN NULL
                           ELSE jsonb_build_array({$column}) END
            ");
        }
    }

    public function down(): void
    {
        foreach ($this->columns as $column) {
            DB::statement("
                ALTER TABLE cai_etude_marche
                ALTER COLUMN {$column} TYPE text
                USING CASE WHEN {$column} IS NULL THEN NULL
                           ELSE (SELECT string_agg(value, ', ') FROM jsonb_array_elements_text({$column})) END
            ");
        }
    }
};

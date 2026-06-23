<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('organisation_visites_echanges')->truncate();

        DB::statement('ALTER TABLE organisation_visites_echanges ALTER COLUMN objectifs_visite TYPE jsonb USING objectifs_visite::jsonb');
        DB::statement('ALTER TABLE organisation_visites_echanges ALTER COLUMN ce_qui_a_marche TYPE jsonb USING ce_qui_a_marche::jsonb');
        DB::statement('ALTER TABLE organisation_visites_echanges ALTER COLUMN ce_qui_doit_etre_ameliore TYPE jsonb USING ce_qui_doit_etre_ameliore::jsonb');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE organisation_visites_echanges ALTER COLUMN objectifs_visite TYPE text USING objectifs_visite::text');
        DB::statement('ALTER TABLE organisation_visites_echanges ALTER COLUMN ce_qui_a_marche TYPE text USING ce_qui_a_marche::text');
        DB::statement('ALTER TABLE organisation_visites_echanges ALTER COLUMN ce_qui_doit_etre_ameliore TYPE text USING ce_qui_doit_etre_ameliore::text');
    }
};

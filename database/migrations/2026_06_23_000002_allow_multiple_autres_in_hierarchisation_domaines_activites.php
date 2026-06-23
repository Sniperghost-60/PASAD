<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                DO $$
                DECLARE constraint_name text;
                BEGIN
                    SELECT con.conname INTO constraint_name
                    FROM pg_constraint con
                    JOIN pg_class rel ON rel.oid = con.conrelid
                    JOIN pg_namespace nsp ON nsp.oid = connamespace
                    WHERE rel.relname = 'hierarchisation_domaines_activites'
                        AND con.contype = 'u'
                        AND pg_get_constraintdef(con.oid) LIKE '%profil_historique_id%'
                        AND pg_get_constraintdef(con.oid) LIKE '%domaine_activite%'
                    LIMIT 1;

                    IF constraint_name IS NOT NULL THEN
                        EXECUTE format('ALTER TABLE hierarchisation_domaines_activites DROP CONSTRAINT %I', constraint_name);
                    END IF;
                END $$;
            SQL);

            return;
        }

        Schema::table('hierarchisation_domaines_activites', function (Blueprint $table) {
            $table->dropUnique(['profil_historique_id', 'domaine_activite']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hierarchisation_domaines_activites', function (Blueprint $table) {
            $table->unique(['profil_historique_id', 'domaine_activite']);
        });
    }
};

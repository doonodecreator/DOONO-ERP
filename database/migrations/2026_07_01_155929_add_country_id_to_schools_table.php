<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Country;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {

            $table->foreignId('country_id')
                ->nullable()
                ->after('organization_id')
                ->constrained()
                ->cascadeOnUpdate();
        });

        /*
        |--------------------------------------------------------------------------
        | Assign all existing schools to Nigeria by default.
        |--------------------------------------------------------------------------
        */

        $nigeria = DB::table('countries')
            ->where('iso2', 'NG')
            ->first();

        if ($nigeria) {

            DB::table('schools')
                ->update([
                    'country_id' => $nigeria->id
                ]);
        }

        Schema::table('schools', function (Blueprint $table) {

            $table->foreignId('country_id')
                ->nullable(false)
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {

            $table->dropForeign(['country_id']);

            $table->dropColumn('country_id');
        });
    }
};

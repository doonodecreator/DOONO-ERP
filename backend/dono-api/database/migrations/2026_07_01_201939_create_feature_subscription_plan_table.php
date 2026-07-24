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
        Schema::create('feature_subscription_plan', function (Blueprint $table) {

            $table->id();

            $table->foreignId('feature_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('subscription_plan_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Whether this feature is enabled for the plan.
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_enabled')
                ->default(true);

            $table->timestamps();

            $table->unique([
                'feature_id',
                'subscription_plan_id'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feature_subscription_plan');
    }
};

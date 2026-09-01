<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('communications')) {
            return;
        }

        Schema::table('communications', function (Blueprint $table): void {
            if (! Schema::hasColumn('communications', 'delivery_channel')) {
                $table->string('delivery_channel', 30)->default('in_app')->after('is_published');
            }
            if (! Schema::hasColumn('communications', 'delivery_status')) {
                $table->string('delivery_status', 30)->default('pending')->after('delivery_channel');
            }
            if (! Schema::hasColumn('communications', 'delivery_recipient_count')) {
                $table->unsignedInteger('delivery_recipient_count')->default(0)->after('delivery_status');
            }
            if (! Schema::hasColumn('communications', 'delivery_attempted_at')) {
                $table->timestamp('delivery_attempted_at')->nullable()->after('delivery_recipient_count');
            }
            if (! Schema::hasColumn('communications', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable()->after('delivery_attempted_at');
            }
            if (! Schema::hasColumn('communications', 'delivery_error')) {
                $table->text('delivery_error')->nullable()->after('delivered_at');
            }
            $table->index(['school_id', 'delivery_status'], 'communications_delivery_status_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('communications')) {
            return;
        }

        Schema::table('communications', function (Blueprint $table): void {
            $table->dropIndex('communications_delivery_status_idx');
            foreach (['delivery_channel', 'delivery_status', 'delivery_recipient_count', 'delivery_attempted_at', 'delivered_at', 'delivery_error'] as $column) {
                if (Schema::hasColumn('communications', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

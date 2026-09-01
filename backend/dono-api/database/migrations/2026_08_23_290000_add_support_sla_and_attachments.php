<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('support_tickets')) {
            Schema::table('support_tickets', function (Blueprint $table) {
                if (! Schema::hasColumn('support_tickets', 'first_response_due_at')) {
                    $table->timestamp('first_response_due_at')->nullable()->after('last_replied_at');
                }
                if (! Schema::hasColumn('support_tickets', 'resolution_due_at')) {
                    $table->timestamp('resolution_due_at')->nullable()->after('first_response_due_at');
                }
                if (! Schema::hasColumn('support_tickets', 'sla_breached_at')) {
                    $table->timestamp('sla_breached_at')->nullable()->after('resolution_due_at');
                }
            });
        }

        if (Schema::hasTable('support_ticket_messages')) {
            Schema::table('support_ticket_messages', function (Blueprint $table) {
                if (! Schema::hasColumn('support_ticket_messages', 'attachment_path')) {
                    $table->string('attachment_path', 500)->nullable()->after('body');
                }
                if (! Schema::hasColumn('support_ticket_messages', 'original_filename')) {
                    $table->string('original_filename', 255)->nullable()->after('attachment_path');
                }
                if (! Schema::hasColumn('support_ticket_messages', 'mime_type')) {
                    $table->string('mime_type', 120)->nullable()->after('original_filename');
                }
                if (! Schema::hasColumn('support_ticket_messages', 'size_bytes')) {
                    $table->unsignedBigInteger('size_bytes')->nullable()->after('mime_type');
                }
                if (! Schema::hasColumn('support_ticket_messages', 'canned_reply_key')) {
                    $table->string('canned_reply_key', 80)->nullable()->after('size_bytes');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('support_ticket_messages')) {
            Schema::table('support_ticket_messages', function (Blueprint $table) {
                $columns = collect(['attachment_path', 'original_filename', 'mime_type', 'size_bytes', 'canned_reply_key'])
                    ->filter(fn (string $column) => Schema::hasColumn('support_ticket_messages', $column))
                    ->values()->all();
                if ($columns) $table->dropColumn($columns);
            });
        }
        if (Schema::hasTable('support_tickets')) {
            Schema::table('support_tickets', function (Blueprint $table) {
                $columns = collect(['first_response_due_at', 'resolution_due_at', 'sla_breached_at'])
                    ->filter(fn (string $column) => Schema::hasColumn('support_tickets', $column))
                    ->values()->all();
                if ($columns) $table->dropColumn($columns);
            });
        }
    }
};

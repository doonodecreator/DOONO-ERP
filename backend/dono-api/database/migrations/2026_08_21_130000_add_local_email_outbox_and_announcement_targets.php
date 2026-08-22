<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('system_settings') && ! Schema::hasColumn('system_settings', 'local_email_mode')) {
            Schema::table('system_settings', function (Blueprint $table) {
                $table->boolean('local_email_mode')->default(true)->after('email_notifications');
            });
        }

        if (Schema::hasTable('platform_announcements')) {
            if (! Schema::hasColumn('platform_announcements', 'target_role')) {
                Schema::table('platform_announcements', function (Blueprint $table) {
                    $table->string('target_role', 80)->nullable()->after('audience');
                });
            }
            if (! Schema::hasColumn('platform_announcements', 'target_school_ids')) {
                Schema::table('platform_announcements', function (Blueprint $table) {
                    $table->json('target_school_ids')->nullable()->after('target_role');
                });
            }
            if (! Schema::hasColumn('platform_announcements', 'target_user_ids')) {
                Schema::table('platform_announcements', function (Blueprint $table) {
                    $table->json('target_user_ids')->nullable()->after('target_school_ids');
                });
            }
        }

        if (! Schema::hasTable('local_email_messages')) {
            Schema::create('local_email_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recipient_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('recipient_email');
                $table->string('message_type', 50)->default('general');
                $table->string('subject');
                $table->longText('body_html')->nullable();
                $table->longText('body_text')->nullable();
                $table->json('action_data')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
                $table->index(['recipient_email', 'created_at']);
                $table->index(['message_type', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('local_email_messages');
        if (Schema::hasTable('platform_announcements')) {
            $columns = array_filter([
                Schema::hasColumn('platform_announcements', 'target_user_ids') ? 'target_user_ids' : null,
                Schema::hasColumn('platform_announcements', 'target_school_ids') ? 'target_school_ids' : null,
                Schema::hasColumn('platform_announcements', 'target_role') ? 'target_role' : null,
            ]);
            if ($columns) {
                Schema::table('platform_announcements', fn (Blueprint $table) => $table->dropColumn($columns));
            }
        }
        if (Schema::hasTable('system_settings') && Schema::hasColumn('system_settings', 'local_email_mode')) {
            Schema::table('system_settings', fn (Blueprint $table) => $table->dropColumn('local_email_mode'));
        }
    }
};

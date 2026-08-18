<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('role_invitations')) {
            Schema::create('role_invitations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('role_id')->constrained('roles')->restrictOnDelete();
                $table->foreignId('invited_by')->constrained('users')->restrictOnDelete();
                $table->foreignId('accepted_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->foreignId('revoked_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('first_name');
                $table->string('middle_name')->nullable();
                $table->string('last_name');
                $table->string('email');
                $table->string('phone');
                $table->string('gender');
                $table->string('designation');
                $table->string('department')->nullable();
                $table->string('staff_number')->nullable();
                $table->date('employment_date')->nullable();
                $table->string('token_hash')->unique();
                $table->string('status')->default('pending')->index();
                $table->timestamp('expires_at')->index();
                $table->timestamp('accepted_at')->nullable();
                $table->timestamp('revoked_at')->nullable();
                $table->timestamps();
                $table->index(['school_id', 'email', 'status']);
            });
        }

        if (! Schema::hasTable('school_setup_delegations')) {
            Schema::create('school_setup_delegations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
                $table->foreignId('granted_by')->constrained('users')->restrictOnDelete();
                $table->timestamps();
                $table->unique(['school_id', 'user_id', 'permission_id'], 'school_setup_delegations_unique');
            });
        }

        $permissionDefinitions = [
            'manage_divisions' => 'Manage Divisions',
            'manage_academic_sessions' => 'Manage Academic Sessions',
            'manage_terms' => 'Manage Terms',
            'manage_classes' => 'Manage Classes',
            'manage_streams' => 'Manage Streams',
            'manage_subjects' => 'Manage Subjects',
            'manage_fee_categories' => 'Manage Fee Categories',
        ];

        foreach ($permissionDefinitions as $slug => $name) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'description' => $name . ' for the current school.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $proprietorRoleId = DB::table('roles')->where('slug', 'proprietor')->value('id');
        $permissionIds = DB::table('permissions')
            ->whereIn('slug', array_keys($permissionDefinitions))
            ->pluck('id');

        if ($proprietorRoleId) {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permission')->updateOrInsert(
                    [
                        'role_id' => $proprietorRoleId,
                        'permission_id' => $permissionId,
                    ],
                    [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        // This repair migration must not remove live tables that may have been
        // created by the original migrations or used by production data.
    }
};

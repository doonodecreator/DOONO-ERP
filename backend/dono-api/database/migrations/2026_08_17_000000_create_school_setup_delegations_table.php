<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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

        DB::table('permissions')->updateOrInsert(
            ['slug' => 'manage_divisions'],
            [
                'name' => 'Manage Divisions',
                'description' => 'Create and manage school academic divisions.',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        $setupPermissions = [
            'manage_divisions',
            'manage_academic_sessions',
            'manage_terms',
            'manage_classes',
            'manage_streams',
            'manage_subjects',
            'manage_fee_categories',
        ];

        $proprietorRoleId = DB::table('roles')->where('slug', 'proprietor')->value('id');
        $permissionIds = DB::table('permissions')->whereIn('slug', $setupPermissions)->pluck('id');

        if ($proprietorRoleId && $permissionIds->isNotEmpty()) {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permission')->updateOrInsert([
                    'role_id' => $proprietorRoleId,
                    'permission_id' => $permissionId,
                ], [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $nonOwnerRoleIds = DB::table('roles')
            ->whereNotIn('slug', ['super_admin', 'proprietor'])
            ->pluck('id');

        if ($nonOwnerRoleIds->isNotEmpty() && $permissionIds->isNotEmpty()) {
            DB::table('role_permission')
                ->whereIn('role_id', $nonOwnerRoleIds)
                ->whereIn('permission_id', $permissionIds)
                ->delete();
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('school_setup_delegations');
    }
};

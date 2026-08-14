<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Align legacy role slugs with the distinct DONO architecture vocabulary.
     * Renaming in place preserves role IDs and existing user_roles links.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $this->renameRole('vice_principal', 'vice_principal_academic', 'Vice Principal Academic', 'Academic leadership');
            $this->renameRole('head_teacher', 'vice_principal_admin', 'Vice Principal Administration', 'Administrative leadership');
            $this->renameRole('school_nurse', 'nurse', 'Nurse', 'School clinic');
            $this->renameRole('transport_officer', 'transport_manager', 'Transport Manager', 'School transport');

            foreach ([
                ['nursery_head', 'Nursery Head', 'Nursery leadership'],
                ['primary_headmaster', 'Primary Headmaster', 'Primary school leadership'],
                ['secondary_principal', 'Secondary Principal', 'Secondary school leadership'],
                ['form_teacher', 'Form Teacher', 'Class pastoral and academic lead'],
            ] as [$slug, $name, $description]) {
                DB::table('roles')->updateOrInsert(
                    ['slug' => $slug],
                    [
                        'name' => $name,
                        'description' => $description,
                        'is_system' => false,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        });
    }

    /**
     * This data alignment is intentionally not reversed automatically.
     * Reversing it could discard roles or assignment links created after deployment.
     */
    public function down(): void
    {
        // No automatic rollback for role vocabulary data migrations.
    }

    private function renameRole(
        string $legacySlug,
        string $canonicalSlug,
        string $name,
        string $description
    ): void {
        $legacy = DB::table('roles')->where('slug', $legacySlug)->first();
        $canonical = DB::table('roles')->where('slug', $canonicalSlug)->first();

        if (! $legacy) {
            if ($canonical) {
                DB::table('roles')->where('id', $canonical->id)->update([
                    'name' => $name,
                    'description' => $description,
                    'updated_at' => now(),
                ]);
            }

            return;
        }

        if (! $canonical) {
            DB::table('roles')->where('id', $legacy->id)->update([
                'slug' => $canonicalSlug,
                'name' => $name,
                'description' => $description,
                'updated_at' => now(),
            ]);

            return;
        }

        foreach (DB::table('user_roles')->where('role_id', $legacy->id)->get() as $assignment) {
            DB::table('user_roles')->updateOrInsert(
                [
                    'user_id' => $assignment->user_id,
                    'role_id' => $canonical->id,
                    'school_id' => $assignment->school_id,
                ],
                [
                    'created_at' => $assignment->created_at ?? now(),
                    'updated_at' => now(),
                ]
            );
        }

        foreach (DB::table('role_permission')->where('role_id', $legacy->id)->get() as $permission) {
            DB::table('role_permission')->updateOrInsert(
                [
                    'role_id' => $canonical->id,
                    'permission_id' => $permission->permission_id,
                ],
                [
                    'created_at' => $permission->created_at ?? now(),
                    'updated_at' => now(),
                ]
            );
        }

        DB::table('roles')->where('id', $legacy->id)->delete();
        DB::table('roles')->where('id', $canonical->id)->update([
            'name' => $name,
            'description' => $description,
            'updated_at' => now(),
        ]);
    }
};

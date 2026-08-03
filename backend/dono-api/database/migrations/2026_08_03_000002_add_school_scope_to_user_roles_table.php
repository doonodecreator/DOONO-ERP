<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Makes user_roles support two tiers of role:
     * - school_id = NULL  → platform-wide role (e.g. software owner / super admin)
     * - school_id = <id>  → role scoped to that one school (Proprietor, Principal, Teacher...)
     *
     * Also widens the uniqueness rule so the same user can hold the same role
     * at more than one school (needed for "multiple schools per proprietor").
     */
    public function up(): void
    {
        // Step 1: add school_id (idempotent — safe if it already exists from a prior run)
        if (!Schema::hasColumn('user_roles', 'school_id')) {
            Schema::table('user_roles', function (Blueprint $table) {
                $table->foreignId('school_id')
                    ->nullable()
                    ->after('role_id')
                    ->constrained('schools')
                    ->cascadeOnDelete();
            });
        }

        // Step 2: MySQL won't drop the old composite unique index while user_id/role_id
        // foreign keys still depend on it as their supporting index — drop those FKs first.
        if ($this->hasForeignKey('user_roles', 'user_roles_user_id_foreign')) {
            Schema::table('user_roles', function (Blueprint $table) {
                $table->dropForeign('user_roles_user_id_foreign');
            });
        }

        if ($this->hasForeignKey('user_roles', 'user_roles_role_id_foreign')) {
            Schema::table('user_roles', function (Blueprint $table) {
                $table->dropForeign('user_roles_role_id_foreign');
            });
        }

        // Step 3: now safe to drop the old two-column unique index
        if ($this->hasIndex('user_roles', 'user_roles_user_id_role_id_unique')) {
            Schema::table('user_roles', function (Blueprint $table) {
                $table->dropUnique('user_roles_user_id_role_id_unique');
            });
        }

        // Step 4: re-add the FKs (now unattached to the dropped index) and the new
        // three-column unique index that includes school_id.
        Schema::table('user_roles', function (Blueprint $table) {
            if (!$this->hasForeignKey('user_roles', 'user_roles_user_id_foreign')) {
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            }
            if (!$this->hasForeignKey('user_roles', 'user_roles_role_id_foreign')) {
                $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            }
            if (!$this->hasIndex('user_roles', 'user_roles_user_role_school_unique')) {
                $table->unique(['user_id', 'role_id', 'school_id'], 'user_roles_user_role_school_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_roles', function (Blueprint $table) {
            if ($this->hasIndex('user_roles', 'user_roles_user_role_school_unique')) {
                $table->dropUnique('user_roles_user_role_school_unique');
            }
            if ($this->hasForeignKey('user_roles', 'user_roles_user_id_foreign')) {
                $table->dropForeign('user_roles_user_id_foreign');
            }
            if ($this->hasForeignKey('user_roles', 'user_roles_role_id_foreign')) {
                $table->dropForeign('user_roles_role_id_foreign');
            }
        });

        Schema::table('user_roles', function (Blueprint $table) {
            $table->unique(['user_id', 'role_id'], 'user_roles_user_id_role_id_unique');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
        });

        if (Schema::hasColumn('user_roles', 'school_id')) {
            Schema::table('user_roles', function (Blueprint $table) {
                $table->dropForeign(['school_id']);
                $table->dropColumn('school_id');
            });
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $conn = Schema::getConnection();
        $result = $conn->select(
            "SHOW INDEX FROM `{$table}` WHERE Key_name = ?",
            [$indexName]
        );
        return count($result) > 0;
    }

    private function hasForeignKey(string $table, string $constraintName): bool
    {
        $conn = Schema::getConnection();
        $database = $conn->getDatabaseName();
        $result = $conn->select(
            "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
            [$database, $table, $constraintName]
        );
        return count($result) > 0;
    }
};

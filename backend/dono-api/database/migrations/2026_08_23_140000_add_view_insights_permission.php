<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    private const ROLES = [
        'proprietor',
        'principal',
        'vice_principal_academic',
        'vice_principal_admin',
        'nursery_head',
        'primary_headmaster',
        'secondary_principal',
    ];

    public function up(): void
    {
        $permission = Permission::firstOrCreate(
            ['slug' => 'view_insights'],
            ['name' => 'View School Insights'],
        );

        Role::whereIn('slug', self::ROLES)->get()->each(function (Role $role) use ($permission) {
            $role->permissions()->syncWithoutDetaching([$permission->id]);
        });
    }

    public function down(): void
    {
        $permission = Permission::where('slug', 'view_insights')->first();
        if (!$permission) {
            return;
        }

        $permission->roles()->detach();
        $permission->delete();
    }
};

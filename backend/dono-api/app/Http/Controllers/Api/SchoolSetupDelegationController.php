<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\SchoolSetupDelegation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolSetupDelegationController extends Controller
{
    private const SETUP_PERMISSIONS = [
        'manage_divisions',
        'manage_academic_sessions',
        'manage_terms',
        'manage_classes',
        'manage_streams',
        'manage_subjects',
        'manage_fee_categories',
    ];

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $delegations = SchoolSetupDelegation::query()
            ->where('school_id', $schoolId)
            ->with(['user:id,name,email', 'permission:id,name,slug'])
            ->latest()
            ->get()
            ->groupBy('user_id')
            ->map(function ($items) {
                $user = $items->first()->user;

                return [
                    'user' => $user,
                    'permissions' => $items->map(fn ($item) => $item->permission)->values(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $delegations,
            'available_permissions' => Permission::whereIn('slug', self::SETUP_PERMISSIONS)
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $schoolId = $this->requireSchool($request);

        if (! $user->hasRole('principal', $schoolId)
            && ! $user->hasRole('vice_principal_academic', $schoolId)) {
            return response()->json([
                'message' => 'Only a Principal or Vice Principal Academic can receive school setup delegation.',
            ], 422);
        }

        $validated = $request->validate([
            'permission_slugs' => ['required', 'array'],
            'permission_slugs.*' => ['string', 'in:'.implode(',', self::SETUP_PERMISSIONS)],
        ]);

        $permissions = Permission::whereIn('slug', $validated['permission_slugs'])
            ->whereIn('slug', self::SETUP_PERMISSIONS)
            ->get();

        DB::transaction(function () use ($schoolId, $user, $permissions) {
            SchoolSetupDelegation::query()
                ->where('school_id', $schoolId)
                ->where('user_id', $user->id)
                ->delete();

            foreach ($permissions as $permission) {
                SchoolSetupDelegation::create([
                    'school_id' => $schoolId,
                    'user_id' => $user->id,
                    'permission_id' => $permission->id,
                    'granted_by' => request()->user()->id,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'School setup permissions updated.',
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        $schoolId = $this->requireSchool($request);

        SchoolSetupDelegation::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'School setup delegation revoked.',
        ]);
    }

}

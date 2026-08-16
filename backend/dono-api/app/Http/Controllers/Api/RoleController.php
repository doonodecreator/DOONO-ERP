<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;

class RoleController extends Controller
{
    /**
     * List roles that may be assigned to school staff through an invitation.
     * Platform, organization-owner, proprietor, student, and parent identities
     * are managed through their own architecture flows.
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Role::whereNotIn('slug', ['super_admin', 'organization_owner', 'proprietor', 'student', 'parent'])
                ->orderBy('name')
                ->get(['id', 'slug', 'name']),
        ]);
    }
}

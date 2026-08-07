<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;

class RoleController extends Controller
{
    /**
     * List assignable roles for staff creation. Excludes super_admin
     * (platform-level, never assigned via the staff form) and student/
     * parent (assigned through their own separate flows, not staff).
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Role::whereNotIn('slug', ['super_admin', 'student', 'parent'])
                ->orderBy('name')
                ->get(['id', 'slug', 'name']),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        return response()->json([
            'message' => 'Register endpoint coming soon.'
        ]);
    }

    /**
     * Login user.
     */
    public function login(Request $request)
    {
        return response()->json([
            'message' => 'Login endpoint coming soon.'
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request)
    {
        return response()->json([
            'message' => 'Logout endpoint coming soon.'
        ]);
    }

    /**
     * Return authenticated user.
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use Illuminate\Http\Request;

class ParentPortalController extends Controller
{
    public function dashboard(Request $request)
    {
        // For development/testing, we grab the first guardian.
        // In production, this would be scoped to auth()->user():
        // $guardian = Guardian::where('user_id', auth()->id())->with('students')->first();
        
        $guardian = Guardian::with('students.class', 'students.division')->first(); 

        if (!$guardian) {
            // Return dummy data if no guardians exist yet so the UI still renders
            return response()->json([
                'parent_profile' => ['first_name' => 'Demo', 'last_name' => 'Parent'],
                'children' => [],
                'recent_notices' => [],
                'outstanding_fees' => 0.00
            ]);
        }

        return response()->json([
            'parent_profile' => $guardian,
            'children' => $guardian->students,
            'recent_notices' => [
                ['id' => 1, 'title' => 'End of Term Examinations', 'date' => now()->addDays(14)->format('Y-m-d')],
                ['id' => 2, 'title' => 'PTA General Meeting', 'date' => now()->addDays(5)->format('Y-m-d')],
            ],
            'outstanding_fees' => 45000.00 // Mock data for now
        ]);
    }
}

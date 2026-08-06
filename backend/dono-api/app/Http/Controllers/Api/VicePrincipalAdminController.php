<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class VicePrincipalAdminController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'admin_summary' => [
                'vp_name' => 'Mr. Victor Igwe',
                'school_name' => 'Apex Citadel Academy',
                'session' => '2025/2026',
                'term' => '3rd Term',
            ],
            'metrics' => [
                'total_staff' => 62,
                'staff_present_today' => 58,
                'pending_leave_requests' => 3,
                'open_discipline_cases' => 2,
                'total_assets_count' => 340,
            ],
            'leave_requests' => [
                ['id' => 1, 'staff' => 'Mrs. Grace Adeleke', 'type' => 'Casual Leave', 'duration' => '2 Days', 'status' => 'Pending Approval'],
                ['id' => 2, 'staff' => 'Mr. Samuel Okafor', 'type' => 'Medical Leave', 'duration' => '3 Days', 'status' => 'Pending Approval'],
            ],
            'upcoming_events' => [
                ['title' => 'Inter-House Sports Competition', 'date' => now()->addDays(10)->format('Y-m-d'), 'venue' => 'Main Sports Complex'],
                ['title' => 'PTA General Meeting', 'date' => now()->addDays(18)->format('Y-m-d'), 'venue' => 'School Auditorium'],
            ]
        ]);
    }
}

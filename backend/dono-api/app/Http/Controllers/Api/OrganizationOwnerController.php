<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OrganizationOwnerController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'organization_profile' => [
                'name' => 'Apex Education Group',
                'owner_name' => 'Aondover Mvenda',
                'code' => 'ORG-APEX-01',
                'active_plan' => 'Enterprise Multi-School',
                'renewal_date' => now()->addMonths(6)->format('Y-m-d')
            ],
            'schools' => [
                ['id' => 1, 'name' => 'Apex Citadel Academy (Secondary)', 'students' => 840, 'staff' => 62, 'status' => 'Active'],
                ['id' => 2, 'name' => 'Apex Early Life (Nursery & Primary)', 'students' => 450, 'staff' => 34, 'status' => 'Active'],
                ['id' => 3, 'name' => 'Apex Model College', 'students' => 610, 'staff' => 48, 'status' => 'Active'],
            ],
            'financial_summary' => [
                'total_revenue_collected' => '₦48,500,000',
                'outstanding_fees' => '₦3,200,000',
                'payroll_expenses' => '₦18,400,000'
            ],
            'leadership_staff' => [
                ['name' => 'Dr. Emmanuel Okafor', 'role' => 'Group Director of Academics', 'school' => 'All Branches'],
                ['name' => 'Mrs. Grace Adeleke', 'role' => 'Principal', 'school' => 'Apex Citadel Academy'],
            ]
        ]);
    }
}

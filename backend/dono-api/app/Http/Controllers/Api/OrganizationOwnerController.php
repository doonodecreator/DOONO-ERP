<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeePayment;
use App\Models\Staff;
use App\Models\Student;
use App\Models\StudentFee;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganizationOwnerController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $organization = $this->context->currentOrganization($user);

        abort_unless(
            $organization && $this->context->canManageOrganization($user, $organization),
            403,
            'No owned organization is available.'
        );

        $schools = $organization->schools()
            ->with(['subscription.subscriptionPlan'])
            ->orderBy('name')
            ->get();
        $schoolIds = $schools->modelKeys();

        $studentCounts = Student::query()
            ->whereIn('school_id', $schoolIds)
            ->whereRaw('LOWER(status) = ?', ['active'])
            ->select([
                'school_id',
                DB::raw('COUNT(*) as total'),
            ])
            ->groupBy('school_id')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->school_id => (int) $row->total]);

        $staffCounts = Staff::query()
            ->whereIn('school_id', $schoolIds)
            ->where('employment_status', 'Active')
            ->select([
                'school_id',
                DB::raw('COUNT(*) as total'),
            ])
            ->groupBy('school_id')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->school_id => (int) $row->total]);

        $studentFees = StudentFee::query()
            ->whereHas('studentEnrollment', function ($query) use ($schoolIds) {
                $query->whereIn('school_id', $schoolIds);
            });
        $feePayments = FeePayment::query()
            ->whereHas('studentFee.studentEnrollment', function ($query) use ($schoolIds) {
                $query->whereIn('school_id', $schoolIds);
            });

        $totalDue = (float) (clone $studentFees)->sum('amount_due');
        $totalRevenue = (float) (clone $feePayments)->sum('amount_paid');

        $activeSubscriptions = $schools
            ->map(fn ($school) => $school->subscription)
            ->filter(fn ($subscription) => $subscription && $subscription->isActive())
            ->values();
        $planNames = $activeSubscriptions
            ->map(fn ($subscription) => $subscription->subscriptionPlan?->name)
            ->filter()
            ->unique()
            ->values();

        $leadership = Staff::query()
            ->with('school')
            ->whereIn('school_id', $schoolIds)
            ->where('employment_status', 'Active')
            ->where(function ($query) {
                $query
                    ->whereRaw('LOWER(designation) LIKE ?', ['%principal%'])
                    ->orWhereRaw('LOWER(designation) LIKE ?', ['%vice principal%'])
                    ->orWhereRaw('LOWER(designation) LIKE ?', ['%head%'])
                    ->orWhereRaw('LOWER(designation) LIKE ?', ['%proprietor%']);
            })
            ->orderBy('first_name')
            ->limit(20)
            ->get()
            ->map(fn (Staff $staff) => [
                'name' => $staff->full_name,
                'role' => $staff->designation,
                'school' => $staff->school?->name,
            ])
            ->values();

        return response()->json([
            'organization_profile' => [
                'name' => $organization->name,
                'owner_name' => $user->name,
                'code' => $organization->short_name ?: $organization->registration_number,
                'school_count' => $schools->count(),
                'active_plan' => $planNames->count() === 1
                    ? $planNames->first()
                    : ($planNames->isNotEmpty() ? 'Multiple active plans' : null),
                'renewal_date' => $activeSubscriptions
                    ->map(fn ($subscription) => $subscription->expiry_date)
                    ->filter()
                    ->sort()
                    ->first()?->format('Y-m-d'),
            ],
            'schools' => $schools->map(fn ($school) => [
                'id' => $school->id,
                'name' => $school->name,
                'students' => (int) ($studentCounts[$school->id] ?? 0),
                'staff' => (int) ($staffCounts[$school->id] ?? 0),
                'status' => $school->status,
                'school_type' => $school->school_type,
                'active_plan' => $school->subscription?->subscriptionPlan?->name,
                'renewal_date' => $school->subscription?->expiry_date?->format('Y-m-d'),
            ])->values(),
            'financial_summary' => [
                'total_revenue_collected' => round($totalRevenue, 2),
                'outstanding_fees' => round($totalDue - $totalRevenue, 2),
                // The inspected Expense API accepts free-form categories; no verified payroll category exists.
                'payroll_expenses' => null,
                'currency' => 'NGN',
            ],
            'leadership_staff' => $leadership,
        ]);
    }

    public function workspace(Request $request)
    {
        $user = $request->user();
        $organization = $this->context->currentOrganization($user);

        abort_unless(
            $organization && $this->context->canManageOrganization($user, $organization),
            403,
            'No owned organization is available.'
        );

        $schools = $organization->schools()->orderBy('name')->get();
        $schoolIds = $schools->modelKeys();
        $users = Staff::query()
            ->with(['school', 'user'])
            ->whereIn('school_id', $schoolIds)
            ->orderBy('first_name')
            ->get()
            ->map(fn (Staff $staff) => [
                'id' => $staff->id,
                'name' => $staff->full_name,
                'email' => $staff->user?->email ?: $staff->email,
                'designation' => $staff->designation,
                'employment_status' => $staff->employment_status,
                'school' => $staff->school?->name,
                'school_id' => $staff->school_id,
            ])->values();

        $incomeBySchool = FeePayment::query()
            ->whereHas('studentFee.studentEnrollment', fn ($query) => $query->whereIn('school_id', $schoolIds))
            ->join('student_fees', 'fee_payments.student_fee_id', '=', 'student_fees.id')
            ->join('student_enrollments', 'student_fees.student_enrollment_id', '=', 'student_enrollments.id')
            ->select('student_enrollments.school_id', DB::raw('SUM(fee_payments.amount_paid) as total'))
            ->groupBy('student_enrollments.school_id')
            ->pluck('total', 'school_id');

        return response()->json([
            'organization' => $organization->only([
                'id', 'name', 'short_name', 'registration_number', 'email', 'phone',
                'alternative_phone', 'website', 'country', 'state', 'lga', 'address', 'status',
            ]),
            'schools' => $schools->map(fn ($school) => [
                'id' => $school->id,
                'name' => $school->name,
                'status' => $school->status,
                'school_type' => $school->school_type,
                'income' => round((float) ($incomeBySchool[$school->id] ?? 0), 2),
            ])->values(),
            'users' => $users,
            'reports' => [
                'school_count' => $schools->count(),
                'user_count' => $users->count(),
                'active_users' => $users->where('employment_status', 'Active')->count(),
                'income' => round((float) $incomeBySchool->sum(), 2),
            ],
        ]);
    }
}

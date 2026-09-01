<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollEntry;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PayslipController extends Controller
{
    public function download(Request $request, PayrollEntry $payrollEntry)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $payrollEntry->school_id === $schoolId, 404);
        abort_unless($payrollEntry->status === 'Paid', 409, 'A payslip is available only after the payroll entry is marked Paid.');

        $payrollEntry->load([
            'school:id,name,address,phone,email',
            'staff:id,school_id,first_name,middle_name,last_name,staff_number,designation',
            'contract:id,contract_number,employment_type,base_salary,allowances,currency',
        ]);

        ActivityLogService::log(
            module: 'payroll',
            action: 'payslip_downloaded',
            description: 'A paid payroll entry payslip was downloaded.',
            subject: $payrollEntry,
            schoolId: $schoolId,
            properties: ['pay_period' => $payrollEntry->pay_period],
        );

        $pdf = Pdf::loadView('pdf.payslip', ['payroll' => $payrollEntry]);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->download('payslip-'.$payrollEntry->pay_period.'-'.$payrollEntry->staff?->staff_number.'.pdf');
    }
}

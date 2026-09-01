<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Payslip {{ $payroll->pay_period }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #172033; font-size: 12px; }
        .header { border-bottom: 3px solid #273c75; padding-bottom: 14px; margin-bottom: 18px; }
        .school { font-size: 22px; font-weight: bold; color: #273c75; }
        .muted { color: #64748b; }
        .title { font-size: 18px; font-weight: bold; margin: 18px 0 10px; }
        .grid { width: 100%; }
        .grid td { width: 50%; vertical-align: top; padding: 6px 0; }
        .label { color: #64748b; font-size: 10px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #dbe3ef; padding: 9px; text-align: left; }
        th { background: #f1f5f9; }
        .amount { text-align: right; }
        .total { font-size: 16px; font-weight: bold; background: #ecfdf5; }
        .footer { margin-top: 28px; border-top: 1px solid #dbe3ef; padding-top: 10px; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="school">{{ $payroll->school?->name ?: 'School' }}</div>
        <div class="muted">{{ $payroll->school?->address }} @if($payroll->school?->phone) · {{ $payroll->school->phone }} @endif @if($payroll->school?->email) · {{ $payroll->school->email }} @endif</div>
    </div>

    <div class="title">Staff Payslip</div>
    <table class="grid">
        <tr>
            <td><div class="label">Staff member</div><strong>{{ $payroll->staff?->full_name ?: trim(($payroll->staff?->first_name ?: '').' '.($payroll->staff?->last_name ?: '')) }}</strong></td>
            <td><div class="label">Pay period</div><strong>{{ $payroll->pay_period }}</strong></td>
        </tr>
        <tr>
            <td><div class="label">Staff number</div>{{ $payroll->staff?->staff_number ?: 'Not assigned' }}</td>
            <td><div class="label">Designation</div>{{ $payroll->staff?->designation ?: 'Staff' }}</td>
        </tr>
        <tr>
            <td><div class="label">Payroll status</div>{{ $payroll->status }}</td>
            <td><div class="label">Paid at</div>{{ $payroll->paid_at?->format('d M Y H:i') ?: '—' }}</td>
        </tr>
    </table>

    <table>
        <thead><tr><th>Description</th><th class="amount">Amount</th></tr></thead>
        <tbody>
            <tr><td>Base salary{{ $payroll->contract?->contract_number ? ' · '.$payroll->contract->contract_number : '' }}</td><td class="amount">{{ $payroll->contract?->currency ?: 'NGN' }} {{ number_format((float) ($payroll->contract?->base_salary ?: $payroll->gross_amount), 2) }}</td></tr>
            @foreach((is_array($payroll->allowances) ? $payroll->allowances : []) as $allowance)
                <tr><td>{{ $allowance['name'] ?? 'Allowance' }}</td><td class="amount">{{ $payroll->contract?->currency ?: 'NGN' }} {{ number_format((float) ($allowance['amount'] ?? 0), 2) }}</td></tr>
            @endforeach
            <tr><td><strong>Gross pay</strong></td><td class="amount"><strong>{{ $payroll->contract?->currency ?: 'NGN' }} {{ number_format((float) $payroll->gross_amount, 2) }}</strong></td></tr>
            <tr><td>Deductions</td><td class="amount">({{ $payroll->contract?->currency ?: 'NGN' }} {{ number_format((float) $payroll->deductions, 2) }})</td></tr>
            <tr class="total"><td>Net pay</td><td class="amount">{{ $payroll->contract?->currency ?: 'NGN' }} {{ number_format((float) $payroll->net_amount, 2) }}</td></tr>
        </tbody>
    </table>

    <div class="footer">This payslip was generated from the school’s recorded payroll entry. It is not a statutory tax certificate.</div>
</body>
</html>

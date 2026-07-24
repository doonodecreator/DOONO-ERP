<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<title>DOONO Payment Receipt</title>

<style>

body{
    font-family: DejaVu Sans, sans-serif;
    font-size:13px;
    color:#333;
}

.header{
    text-align:center;
    margin-bottom:25px;
}

.title{
    font-size:30px;
    font-weight:bold;
    color:#1565C0;
}

.subtitle{
    font-size:15px;
    color:#666;
}

table{
    width:100%;
    border-collapse:collapse;
}

td{
    padding:10px;
    border-bottom:1px solid #e5e5e5;
}

.label{
    width:40%;
    font-weight:bold;
}

.amount{
    color:#0a7d32;
    font-size:24px;
    font-weight:bold;
}

.status{
    color:#0a7d32;
    font-weight:bold;
}

.footer{
    margin-top:40px;
    text-align:center;
    color:#777;
    font-size:12px;
}

</style>

</head>

<body>

<div class="header">

<div class="title">
DOONO
</div>

<div class="subtitle">
Official Payment Receipt
</div>

</div>

<table>

<tr>
<td class="label">Receipt Reference</td>
<td>{{ $transaction->reference }}</td>
</tr>

<tr>
<td class="label">School Name</td>
<td>{{ $school->name }}</td>
</tr>

<tr>
<td class="label">School Email</td>
<td>{{ $school->email }}</td>
</tr>

<tr>
<td class="label">Subscription Plan</td>
<td>{{ $plan->name }}</td>
</tr>
<tr>
<td class="label">Billing Cycle</td>
<td>{{ ucfirst(str_replace('_',' ', $transaction->billing_cycle)) }}</td>
</tr>

<tr>
<td class="label">Payment Status</td>
<td class="status">{{ ucfirst($transaction->status) }}</td>
</tr>

<tr>
<td class="label">Amount Paid</td>
<td class="amount">
{{ $transaction->currency }}
{{ number_format($transaction->amount,2) }}
</td>
</tr>

<tr>
<td class="label">Payment Date</td>
<td>
{{ optional($transaction->paid_at)->format('d M Y h:i A') }}
</td>
</tr>

<tr>
<td class="label">Subscription Expires</td>
<td>
{{ optional($subscription->expiry_date)->format('d M Y') }}
</td>
</tr>

</table>

<div class="footer">

<p>
Thank you for choosing <strong>DOONO</strong>.
</p>

<p>
This receipt was generated automatically by the DOONO School ERP Platform.
</p>

</div>

</body>
</html>

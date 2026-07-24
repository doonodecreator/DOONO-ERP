<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt</title>
</head>

<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f6f9;padding:30px;">

<div style="max-width:700px;margin:auto;background:white;padding:40px;border-radius:10px;">

<h2 style="color:#2563eb;">
DONO School ERP
</h2>

<h3>
Payment Receipt
</h3>

<p>

Hello
<strong>{{ $transaction->school->name }}</strong>,

</p>

<p>

Your payment has been received successfully.

</p>

<hr>

<table width="100%" cellpadding="8">

<tr>
<td><strong>Reference</strong></td>
<td>{{ $transaction->reference }}</td>
</tr>

<tr>
<td><strong>Gateway</strong></td>
<td>{{ ucfirst($transaction->gateway) }}</td>
</tr>

<tr>
<td><strong>Plan</strong></td>
<td>{{ $transaction->schoolSubscription->subscriptionPlan->name }}</td>
</tr>

<tr>
<td><strong>Billing Cycle</strong></td>
<td>{{ ucfirst(str_replace('_',' ',$transaction->billing_cycle)) }}</td>
</tr>

<tr>
<td><strong>Amount Paid</strong></td>
<td>{{ $transaction->currency }} {{ number_format($transaction->amount,2) }}</td>
</tr>

<tr>
<td><strong>Status</strong></td>
<td>{{ ucfirst($transaction->status) }}</td>
</tr>

<tr>
<td><strong>Payment Date</strong></td>
<td>{{ $transaction->paid_at }}</td>
</tr>

<tr>
<td><strong>Next Renewal</strong></td>
<td>{{ $transaction->schoolSubscription->next_billing_date }}</td>
</tr>

</table>

<hr>

<p>

Thank you for using DONO School ERP.

</p>

<small>

This receipt was generated automatically.

</small>

</div>

</body>
</html>

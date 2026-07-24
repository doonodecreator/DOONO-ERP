<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Subscription Reminder</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background:#f4f4f4; margin:0; padding:30px;">

<div style="max-width:700px; margin:auto; background:#ffffff; border-radius:8px; padding:40px;">

    <h2 style="color:#1f2937;">
        Hello {{ $subscription->school->name }},
    </h2>

    <p style="font-size:16px; color:#444;">
        This is a friendly reminder that your <strong>{{ $subscription->subscriptionPlan->name }}</strong>
        subscription to <strong>DONO ERP</strong> will expire in
        <strong>{{ $daysRemaining }} day(s)</strong>.
    </p>

    <p style="font-size:16px; color:#444;">
        Expiry Date:
        <strong>{{ $subscription->expiry_date->format('F d, Y') }}</strong>
    </p>

    <p style="font-size:16px; color:#444;">
        To avoid interruption of your school's services, please renew your subscription before the expiry date.
    </p>

    <div style="margin:35px 0;">
        <a href="{{ config('app.url') }}"
           style="background:#2563eb; color:#ffffff; padding:14px 25px; text-decoration:none; border-radius:6px;">
            Renew Subscription
        </a>
    </div>

    <hr>

    <p style="font-size:13px; color:#888;">
        Thank you for choosing DONO ERP.
    </p>

</div>

</body>
</html>

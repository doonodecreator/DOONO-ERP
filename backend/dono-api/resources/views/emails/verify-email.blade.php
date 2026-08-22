@component('mail::message')
# Verify your email address

Hello {{ $user->name }},

Please verify this email address to activate your DONO School ERP account. This link expires in 24 hours.

@component('mail::button', ['url' => $verificationUrl])
Verify email address
@endcomponent

If you did not create this account, you can ignore this message.

Regards,\
{{ config('app.name', 'DONO School ERP') }}
@endcomponent

@component('mail::message')
# Reset your password

Hello {{ $user->name }},

We received a request to reset your DONO School ERP password. This link expires according to the platform password-reset policy.

@component('mail::button', ['url' => $resetUrl])
Reset password
@endcomponent

If you did not request this, no action is required.

Regards,\
{{ config('app.name', 'DONO School ERP') }}
@endcomponent

@component('mail::message')
# DONO School ERP email test

This is a test email for {{ $recipient }}. Your configured mail provider can deliver messages from the platform.

Regards,\
{{ config('app.name', 'DONO School ERP') }}
@endcomponent

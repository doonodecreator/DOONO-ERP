@component('mail::message')
# {{ $announcement->subject }}

{!! nl2br(e($announcement->body)) !!}

@if($announcement->action_url)
@component('mail::button', ['url' => $announcement->action_url])
{{ $announcement->action_label ?: 'Open DONO School ERP' }}
@endcomponent
@endif

Regards,\
{{ config('app.name', 'DONO School ERP') }}
@endcomponent

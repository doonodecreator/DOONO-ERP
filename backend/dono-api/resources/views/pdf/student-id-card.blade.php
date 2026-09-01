<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Student ID {{ $student->admission_number ?: $student->id }}</title>
    <style>
        @page { size: 85.60mm 53.98mm; margin: 0; }
        * { box-sizing: border-box; }
        html, body { width: 85.60mm; height: 53.98mm; margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, sans-serif; color: #172033; font-size: 7px; }
        .card-page { position: relative; width: 85.60mm; height: 53.98mm; padding: 0; overflow: hidden; page-break-after: always; }
        .card-page:last-child { page-break-after: auto; }
        .card-shell { position: absolute; top: 2.5mm; right: 2.5mm; bottom: 2.5mm; left: 2.5mm; overflow: hidden; border: .55mm solid {{ $primaryColor }}; border-radius: 3.2mm; background: #ffffff; }
        .front-top { height: 15mm; padding: 2.2mm 3.6mm 1.5mm; color: #ffffff; background: {{ $primaryColor }}; }
        .brand-row { position: relative; width: 100%; height: 10mm; }
        .brand-logo-cell { position: absolute; top: 0; left: 0; width: 10mm; height: 10mm; }
        .brand-logo { display: block; width: 9mm; height: 9mm; object-fit: contain; border-radius: 1.4mm; background: #ffffff; }
        .brand-mark { display: block; width: 9mm; height: 9mm; padding-top: 2mm; border-radius: 1.4mm; background: #ffffff; color: {{ $primaryColor }}; font-size: 10px; font-weight: bold; text-align: center; }
        .brand-copy { position: absolute; top: 0; right: 0; left: 12mm; }
        .school-name { margin: 0; font-size: 9px; font-weight: bold; line-height: 1.1; text-transform: uppercase; }
        .school-meta { margin-top: .7mm; font-size: 5.4px; line-height: 1.15; color: #e0e7ff; }
        .card-title { margin-top: .8mm; font-size: 5.4px; font-weight: bold; letter-spacing: .6px; text-transform: uppercase; }
        .front-body { position: relative; height: 32.5mm; padding: 2.2mm 3.6mm; }
        .photo-box { position: absolute; top: 2.2mm; right: 3.6mm; width: 19mm; height: 22mm; overflow: hidden; border: .45mm solid {{ $accentColor }}; border-radius: 2mm; background: #e2e8f0; text-align: center; }
        .photo { display: block; width: 100%; height: 100%; object-fit: cover; }
        .initials { padding-top: 7mm; color: {{ $primaryColor }}; font-size: 17px; font-weight: bold; }
        .identity { width: 49mm; }
        .label { display: block; color: #64748b; font-size: 4.8px; font-weight: bold; letter-spacing: .3px; text-transform: uppercase; }
        .value { display: block; margin: .45mm 0 0; color: #172033; font-size: 6.8px; line-height: 1.1; }
        .name { max-height: 6mm; overflow: hidden; font-size: 8.6px; font-weight: bold; line-height: 1.05; text-transform: uppercase; }
        .identity-row { margin-top: 1.45mm; }
        .two-col { position: relative; width: 100%; min-height: 7mm; }
        .two-col > div { position: absolute; top: 0; width: 48%; }
        .two-col > div:first-child { left: 0; }
        .two-col > div:last-child { right: 0; }
        .two-col > div + div { padding-left: 0; }
        .status-pill { display: inline-block; margin-top: .7mm; padding: .8mm 2mm; border-radius: 8mm; background: #dcfce7; color: #166534; font-size: 6px; font-weight: bold; text-transform: uppercase; }
        .front-footer { position: absolute; right: 3.6mm; bottom: 1.8mm; left: 3.6mm; padding-top: .9mm; border-top: .25mm solid #cbd5e1; color: #64748b; font-size: 4.5px; line-height: 1.05; }
        .back-top { height: 10mm; padding: 2.5mm 3.6mm 1.5mm; color: #ffffff; background: {{ $secondaryColor }}; }
        .back-title { margin: 0; font-size: 7.4px; font-weight: bold; letter-spacing: .35px; text-transform: uppercase; }
        .back-subtitle { margin: .6mm 0 0; color: #cbd5e1; font-size: 5px; line-height: 1.05; }
        .back-body { padding: 2mm 3.6mm 1.5mm; }
        .info-block { margin-bottom: 1.2mm; }
        .info-block-title { margin: 0 0 .5mm; color: {{ $primaryColor }}; font-size: 5.4px; font-weight: bold; letter-spacing: .3px; text-transform: uppercase; }
        .info-line { margin: 0; color: #334155; font-size: 5.5px; line-height: 1.15; }
        .info-line strong { color: #172033; }
        .contact-box { padding: 1mm 1.5mm; border-left: .8mm solid {{ $accentColor }}; background: #f8fafc; }
        .contact-name { margin: 0; color: #172033; font-size: 6px; font-weight: bold; }
        .contact-detail { margin: .4mm 0 0; color: #475569; font-size: 5px; line-height: 1.1; }
        .authorization { position: relative; width: 100%; height: 7mm; margin-top: .6mm; }
        .authorization-cell { position: absolute; bottom: 0; width: 48%; }
        .authorization-cell:first-child { left: 0; }
        .authorization-cell:last-child { right: 0; }
        .authorization-cell + .authorization-cell { padding-left: 0; }
        .signature { display: block; width: 18mm; height: 4mm; object-fit: contain; }
        .stamp { display: block; width: 12mm; height: 5mm; object-fit: contain; }
        .signature-line { width: 23mm; margin-top: .35mm; border-top: .2mm solid #64748b; color: #64748b; font-size: 4.4px; }
        .back-footer { position: absolute; right: 3.6mm; bottom: 1.5mm; left: 3.6mm; padding-top: .7mm; border-top: .25mm solid #cbd5e1; color: #64748b; font-size: 4.4px; line-height: 1.05; }
        .accent-bar { position: absolute; right: 0; bottom: 0; left: 0; height: 1.3mm; background: {{ $accentColor }}; }
    </style>
</head>
<body>
@php
    $fullName = trim((string) $student->full_name) ?: trim(implode(' ', array_filter([(string) $student->first_name, (string) $student->last_name])));
    $initials = strtoupper(substr((string) $student->first_name, 0, 1) . substr((string) $student->last_name, 0, 1));
    $guardianName = $guardian ? trim(implode(' ', array_filter([(string) $guardian->first_name, (string) $guardian->last_name]))) : null;
    $schoolDisplayName = $school?->short_name ?: $school?->name ?: 'School';
@endphp

<div class="card-page">
    <div class="card-shell">
        <div class="front-top">
            <div class="brand-row">
                <div class="brand-logo-cell">
                    @if($schoolLogo)
                        <img class="brand-logo" src="{{ $schoolLogo }}" alt="School logo">
                    @else
                        <div class="brand-mark">{{ strtoupper(substr($schoolDisplayName, 0, 1)) }}</div>
                    @endif
                </div>
                <div class="brand-copy">
                    <p class="school-name">{{ $school?->name ?: 'School' }}</p>
                    <p class="school-meta">{{ $school?->school_code ? 'School code: '.$school->school_code : 'Official school identity document' }}</p>
                    <p class="card-title">Student identity card</p>
                </div>
            </div>
        </div>
        <div class="front-body">
            <div class="photo-box">
                @if($studentPhoto)
                    <img class="photo" src="{{ $studentPhoto }}" alt="Student photograph">
                @else
                    <div class="initials">{{ $initials ?: 'ST' }}</div>
                @endif
            </div>
            <div class="identity">
                <span class="label">Student name</span>
                <span class="value name">{{ $fullName ?: 'Student name not assigned' }}</span>
                <div class="identity-row two-col">
                    <div><span class="label">Admission no.</span><span class="value">{{ $student->admission_number ?: 'Not assigned' }}</span></div>
                    <div><span class="label">Status</span><span class="status-pill">Active</span></div>
                </div>
                <div class="identity-row">
                    <span class="label">Class / stream</span>
                    <span class="value">{{ $student->class?->name ?: 'Class not assigned' }}@if($student->stream?->name) · {{ $student->stream->name }}@endif</span>
                </div>
                <div class="identity-row">
                    <span class="label">Division</span>
                    <span class="value">{{ $student->division?->name ?: 'Division not assigned' }}</span>
                </div>
            </div>
        </div>
        <div class="accent-bar"></div>
    </div>
</div>

<div class="card-page">
    <div class="card-shell">
        <div class="back-top">
            <p class="back-title">Student record &amp; verification</p>
            <p class="back-subtitle">Show to authorized staff · If found, return to {{ $schoolDisplayName }} · Valid while active</p>
        </div>
        <div class="back-body">
            <div class="info-block">
                <p class="info-block-title">School contact</p>
                <p class="info-line"><strong>{{ $school?->name ?: 'School' }}</strong>@if($school?->school_code) · Code {{ $school->school_code }}@endif</p>
                @if($school?->address)<p class="info-line">{{ $school->address }}</p>@endif
                <p class="info-line">@if($school?->phone){{ $school->phone }}@endif @if($school?->email) · {{ $school->email }}@endif</p>
            </div>
            <div class="info-block">
                <p class="info-block-title">Emergency contact</p>
                <div class="contact-box">
                    @if($guardian)
                        <p class="contact-name">{{ $guardianName ?: 'Authorized guardian' }}</p>
                        <p class="contact-detail">@if($guardian->phone)Phone: {{ $guardian->phone }}@endif @if($guardian->email) · Email: {{ $guardian->email }}@endif</p>
                    @else
                        <p class="contact-name">Contact the school office</p>
                        <p class="contact-detail">Contact the school office for emergency assistance.</p>
                    @endif
                </div>
            </div>
            <div class="two-col">
                <div>
                    <span class="label">Date of birth</span>
                    <span class="value">{{ $student->date_of_birth ?: 'Not recorded' }}</span>
                </div>
                <div>
                    <span class="label">Issued</span>
                    <span class="value">{{ $generatedAt?->format('d M Y') ?: '—' }}</span>
                </div>
            </div>
            <div class="authorization">
                <div class="authorization-cell">
                    @if($principalSignature)<img class="signature" src="{{ $principalSignature }}" alt="Authorized signature">@endif
                    <div class="signature-line">Authorized school officer</div>
                </div>
                <div class="authorization-cell">
                    @if($schoolStamp)<img class="stamp" src="{{ $schoolStamp }}" alt="School stamp">@endif
                    <div class="signature-line">School stamp</div>
                </div>
            </div>
        </div>
        <div class="back-footer">If found, return to {{ $schoolDisplayName }} · Lost or incorrect? Contact the school office · Valid while active</div>
        <div class="accent-bar"></div>
    </div>
</div>
</body>
</html>

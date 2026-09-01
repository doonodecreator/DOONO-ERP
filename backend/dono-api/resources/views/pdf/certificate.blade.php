<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Certificate {{ $record->certificate_number }}</title><style>body{font-family:DejaVu Sans,sans-serif;color:#1e293b;text-align:center;padding:55px;border:12px solid #273c75}h1{font-size:34px;color:#273c75;margin:18px 0}.school{font-size:24px;font-weight:bold;color:#0f172a}.eyebrow{font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#64748b}.name{font-size:30px;font-weight:bold;margin:24px 0 10px}.rule{width:65%;border-top:1px solid #94a3b8;margin:20px auto}.details{font-size:14px;line-height:1.8}.meta{margin-top:35px;font-size:12px;color:#475569}</style></head><body>
<div class="eyebrow">Official certificate of completion</div>
<div class="school">{{ $record->school?->name ?: 'School' }}</div>
<div class="details">{{ $record->school?->address }} @if($record->school?->phone) · {{ $record->school->phone }} @endif</div>
<div class="rule"></div>
<p>This is to certify that</p>
<div class="name">{{ $record->student?->full_name ?: trim(($record->student?->first_name ?: '').' '.($record->student?->last_name ?: '')) }}</div>
<p class="details">Admission number: <strong>{{ $record->student?->admission_number ?: 'Not assigned' }}</strong><br>has completed the school programme and is recorded as <strong>{{ ucfirst($record->status) }}</strong>.</p>
<div class="meta">Certificate number: <strong>{{ $record->certificate_number }}</strong> · Academic session: <strong>{{ $record->academicSession?->name ?: 'Not specified' }}</strong><br>Graduation date: <strong>{{ $record->graduation_date?->format('d M Y') ?: 'Not specified' }}</strong></div>
</body></html>

<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Report Card</title>
    <style>
        @page { margin: 24px 28px 30px; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #1f2937; font-family: DejaVu Sans, sans-serif; font-size: 10px; }
        .page { position: relative; }
        .watermark { position: fixed; top: 46%; left: 18%; width: 64%; text-align: center; color: #64748b; opacity: .08; font-size: 26px; transform: rotate(-28deg); }
        .header { border: 1px solid {{ $branding['primary_color'] ?? '#1E40AF' }}; padding: 12px; background: {{ $branding['secondary_color'] ?? '#FFFFFF' }}; }
        .header-table, .summary-table, .student-table, .signature-table { width: 100%; border-collapse: collapse; }
        .logo-cell { width: 82px; vertical-align: middle; }
        .logo { width: 70px; height: 70px; object-fit: contain; }
        .school-name { color: {{ $branding['primary_color'] ?? '#1E40AF' }}; font-size: 20px; font-weight: bold; text-transform: uppercase; }
        .school-meta { color: #475569; line-height: 1.5; }
        .motto { color: {{ $branding['accent_color'] ?? '#F59E0B' }}; font-style: italic; font-weight: bold; }
        .title { margin: 14px 0 8px; color: {{ $branding['primary_color'] ?? '#1E40AF' }}; font-size: 15px; font-weight: bold; text-align: center; text-transform: uppercase; }
        .custom-block { margin: 8px 0; color: #334155; line-height: 1.45; }
        .student-table { margin-top: 10px; border: 1px solid #cbd5e1; }
        .student-table td { padding: 6px 7px; border: 1px solid #e2e8f0; }
        .student-label { width: 17%; color: #64748b; font-weight: bold; }
        .student-photo-cell { width: 82px; text-align: center; vertical-align: middle; }
        .student-photo { width: 64px; height: 72px; object-fit: cover; border: 1px solid #cbd5e1; }
        .section-heading { margin: 14px 0 5px; padding: 6px 8px; background: {{ $branding['primary_color'] ?? '#1E40AF' }}; color: #fff; font-size: 11px; font-weight: bold; }
        .results-table { width: 100%; border-collapse: collapse; }
        .results-table th { padding: 7px 5px; border: 1px solid {{ $branding['primary_color'] ?? '#1E40AF' }}; background: {{ $branding['primary_color'] ?? '#1E40AF' }}; color: #fff; font-size: 9px; }
        .results-table td { padding: 6px 5px; border: 1px solid #cbd5e1; }
        .results-table tr:nth-child(even) td { background: #f8fafc; }
        .right { text-align: right; }
        .center { text-align: center; }
        .summary-table { margin-top: 10px; }
        .summary-table td { width: 25%; padding: 7px; border: 1px solid #cbd5e1; }
        .summary-label { color: #64748b; font-size: 8px; text-transform: uppercase; }
        .summary-value { color: {{ $branding['primary_color'] ?? '#1E40AF' }}; font-size: 13px; font-weight: bold; }
        .comment { min-height: 38px; padding: 7px; border: 1px solid #cbd5e1; line-height: 1.45; }
        .signature-table { margin-top: 22px; }
        .signature-table td { width: 33%; padding: 4px; text-align: center; vertical-align: bottom; }
        .signature-image { max-width: 110px; max-height: 44px; object-fit: contain; }
        .stamp-image { max-width: 70px; max-height: 60px; object-fit: contain; }
        .line { margin-top: 7px; border-top: 1px solid #64748b; }
        .footer { margin-top: 18px; padding-top: 7px; border-top: 1px solid #cbd5e1; color: #64748b; font-size: 8px; text-align: center; }
        .theme-modern .header { border-width: 0 0 4px; border-radius: 0; }
        .theme-modern .section-heading { border-radius: 4px; letter-spacing: .04em; }
        .theme-minimal .header { border-color: #cbd5e1; background: #fff; }
        .theme-minimal .section-heading { background: #f8fafc; color: {{ $branding['primary_color'] ?? '#1E40AF' }}; border: 1px solid #cbd5e1; }
    </style>
</head>
<body class="theme-{{ $branding['theme'] ?? 'classic' }}">
    @if(($branding['show_watermark'] ?? true) && !empty($branding['watermark_text']))
        <div class="watermark">{{ $branding['watermark_text'] }}</div>
    @endif

    <div class="page">
        <div class="header">
            <table class="header-table">
                <tr>
                    <td class="logo-cell">
                        @if(!empty($branding['logo']))
                            <img class="logo" src="{{ $branding['logo'] }}" alt="School logo">
                        @endif
                    </td>
                    <td>
                        <div class="school-name">{{ $school?->name ?? 'School' }}</div>
                        @if($school_settings?->motto)
                            <div class="motto">{{ $school_settings->motto }}</div>
                        @endif
                        <div class="school-meta">
                            {{ $school?->address }}
                            @if($school?->phone) · {{ $school->phone }} @endif
                            @if($school?->email) · {{ $school->email }} @endif
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        @if(!empty($branding['custom_header']))
            <div class="custom-block">{!! nl2br(e($branding['custom_header'])) !!}</div>
        @endif

        <div class="title">{{ $term?->name ?? 'Term' }} Report Card · {{ $academicSession?->name ?? 'Academic Session' }}</div>

        <table class="student-table">
            <tr>
                <td class="student-label">Student</td>
                <td>{{ $student?->student?->full_name ?? 'Student' }}</td>
                <td class="student-label">Admission No.</td>
                <td>{{ $student?->student?->admission_number ?? '—' }}</td>
                <td class="student-photo-cell" rowspan="3">
                    @if(!empty($branding['student_photo']))
                        <img class="student-photo" src="{{ $branding['student_photo'] }}" alt="Student photo">
                    @endif
                </td>
            </tr>
            <tr>
                <td class="student-label">Class</td>
                <td>{{ $student?->class?->name ?? '—' }}</td>
                <td class="student-label">Stream</td>
                <td>{{ $student?->stream?->name ?? '—' }}</td>
            </tr>
            <tr>
                <td class="student-label">Parent/Guardian</td>
                <td>{{ $parent?->full_name ?? '—' }}</td>
                <td class="student-label">Generated</td>
                <td>{{ $generated_at }}</td>
            </tr>
        </table>

        <div class="section-heading">Subject Performance</div>
        <table class="results-table">
            <thead>
                <tr>
                    <th style="width: 28px">#</th>
                    <th>Subject</th>
                    <th>CA</th>
                    <th>Exam</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Remark</th>
                    @if($academic_configuration?->show_class_position ?? true)<th>Position</th>@endif
                </tr>
            </thead>
            <tbody>
                @forelse($subject_results as $index => $result)
                    <tr>
                        <td class="center">{{ $index + 1 }}</td>
                        <td>{{ $result?->subject?->name ?? 'Subject' }}</td>
                        <td class="center">{{ number_format((float) ($result->ca_score ?? 0), 2) }}</td>
                        <td class="center">{{ number_format((float) ($result->exam_score ?? 0), 2) }}</td>
                        <td class="center">{{ number_format((float) ($result->total_score ?? 0), 2) }}</td>
                        <td class="center">{{ $result->grade ?? '—' }}</td>
                        <td>{{ $result->remark ?? '—' }}</td>
                        @if($academic_configuration?->show_class_position ?? true)<td class="center">{{ $result->position ?? '—' }}</td>@endif
                    </tr>
                @empty
                    <tr><td colspan="8" class="center">No subject results are available for this report.</td></tr>
                @endforelse
            </tbody>
        </table>

        <table class="summary-table">
            <tr>
                <td><div class="summary-label">Total Score</div><div class="summary-value">{{ number_format((float) ($summary?->total_score ?? 0), 2) }}</div></td>
                @if($academic_configuration?->show_class_average ?? true)
                    <td><div class="summary-label">Average</div><div class="summary-value">{{ number_format((float) ($summary?->student_average ?? 0), 2) }}%</div></td>
                @else
                    <td><div class="summary-label">Subjects Passed</div><div class="summary-value">{{ $summary?->subjects_passed ?? '—' }}</div></td>
                @endif
                @if($academic_configuration?->show_class_position ?? true)
                    <td><div class="summary-label">Class Position</div><div class="summary-value">{{ $summary?->position ?? '—' }}</div></td>
                @else
                    <td><div class="summary-label">Subjects Passed</div><div class="summary-value">{{ $summary?->subjects_passed ?? '—' }}</div></td>
                @endif
                <td><div class="summary-label">Overall Grade</div><div class="summary-value">{{ $summary?->overall_grade ?? '—' }}</div></td>
            </tr>
        </table>

        @if($academic_configuration?->show_attendance ?? true)
            <div class="section-heading">Attendance</div>
            <table class="summary-table">
                <tr>
                    <td><div class="summary-label">Days Opened</div><div class="summary-value">{{ $attendance['days_opened'] ?? 0 }}</div></td>
                    <td><div class="summary-label">Present</div><div class="summary-value">{{ $attendance['days_present'] ?? 0 }}</div></td>
                    <td><div class="summary-label">Absent</div><div class="summary-value">{{ $attendance['days_absent'] ?? 0 }}</div></td>
                    <td><div class="summary-label">Attendance</div><div class="summary-value">{{ number_format((float) ($attendance['attendance_percentage'] ?? 0), 2) }}%</div></td>
                </tr>
            </table>
        @endif

        <div class="section-heading">Comments and Promotion</div>
        @if($academic_configuration?->show_teacher_comment ?? true)
            <div class="comment"><strong>Class Teacher Comment:</strong> {{ $summary?->class_teacher_remark ?? '—' }}</div>
        @endif
        @if($academic_configuration?->show_principal_comment ?? true)
            <div class="comment" style="margin-top: 6px"><strong>Principal Comment:</strong> {{ $summary?->principal_remark ?? '—' }}</div>
        @endif
        <table class="summary-table">
            <tr>
                <td><div class="summary-label">Overall Remark</div><div class="summary-value">{{ $summary?->overall_remark ?? '—' }}</div></td>
                <td><div class="summary-label">Promotion Status</div><div class="summary-value">{{ $summary?->promotion_status ?? '—' }}</div></td>
                <td><div class="summary-label">Next Term Begins</div><div class="summary-value">{{ $summary?->next_term_begins ?? '—' }}</div></td>
                <td><div class="summary-label">Published</div><div class="summary-value">{{ ($summary?->is_published ?? false) ? 'Yes' : 'No' }}</div></td>
            </tr>
        </table>

        <table class="signature-table">
            <tr>
                <td>
                    @if(($academic_configuration?->show_principal_signature ?? true) && !empty($branding['principal_signature']))
                        <img class="signature-image" src="{{ $branding['principal_signature'] }}" alt="Principal signature">
                    @endif
                    <div class="line">Class Teacher</div>
                </td>
                <td>
                    @if(($academic_configuration?->show_school_stamp ?? true) && !empty($branding['school_stamp']))
                        <img class="stamp-image" src="{{ $branding['school_stamp'] }}" alt="School stamp">
                    @endif
                    <div class="line">School Stamp</div>
                </td>
                <td>
                    @if(($academic_configuration?->show_principal_signature ?? true) && !empty($branding['principal_signature']))
                        <img class="signature-image" src="{{ $branding['principal_signature'] }}" alt="Principal signature">
                    @endif
                    <div class="line">Principal</div>
                </td>
            </tr>
        </table>

        @if(!empty($branding['custom_footer']))
            <div class="custom-block">{!! nl2br(e($branding['custom_footer'])) !!}</div>
        @endif
        <div class="footer">DOONO De Creator ERP · {{ $school?->name ?? 'School' }}</div>
    </div>
</body>
</html>

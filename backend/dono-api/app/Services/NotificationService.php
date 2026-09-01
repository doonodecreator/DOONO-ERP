<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Communication;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    public function __construct(private NotificationPreferenceService $preferences) {}

    public function notifyCommunication(Communication $communication): int
    {
        if (!$communication->is_published || !$communication->school_id) {
            return 0;
        }

        $recipientIds = $this->recipientIdsForCommunication($communication);
        $organizationId = $communication->school?->organization_id
            ?? DB::table('schools')->where('id', $communication->school_id)->value('organization_id');
        $created = 0;

        foreach ($recipientIds as $userId) {
            if (! $this->preferences->enabled((int) $userId, (int) $communication->school_id, (string) ($communication->type ?: 'notice'), 'in_app')) {
                continue;
            }
            $created += DB::table('app_notifications')->insertOrIgnore([
                'organization_id' => $organizationId,
                'school_id' => $communication->school_id,
                'user_id' => $userId,
                'type' => $communication->type ?: 'notice',
                'priority' => 'normal',
                'title' => $communication->subject ?: 'School notice',
                'body' => $communication->body,
                'source_type' => Communication::class,
                'source_id' => $communication->id,
                'dedupe_key' => "communication:{$communication->id}:user:{$userId}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $created;
    }

    public function notifyAttendanceAbsence(Attendance $attendance): int
    {
        $attendance->loadMissing('studentEnrollment.student');
        $student = $attendance->studentEnrollment?->student;
        if (! $student || $attendance->status !== 'Absent') {
            return 0;
        }

        $schoolId = (int) $attendance->school_id;
        $organizationId = DB::table('schools')->where('id', $schoolId)->value('organization_id');
        $parentUserIds = DB::table('guardians')
            ->join('guardian_student', 'guardian_student.guardian_id', '=', 'guardians.id')
            ->where('guardians.school_id', $schoolId)
            ->where('guardian_student.student_id', $student->id)
            ->whereNotNull('guardians.user_id')
            ->distinct()
            ->pluck('guardians.user_id');

        $created = 0;
        foreach ($parentUserIds as $userId) {
            if (! $this->preferences->enabled((int) $userId, $schoolId, 'attendance_absence', 'in_app')) {
                continue;
            }
            $created += DB::table('app_notifications')->insertOrIgnore([
                'organization_id' => $organizationId,
                'school_id' => $schoolId,
                'user_id' => $userId,
                'type' => 'attendance_absence',
                'priority' => 'high',
                'title' => 'Attendance needs your attention',
                'body' => sprintf('%s was marked absent on %s. Please contact the school if this is unexpected.', $student->full_name, $attendance->attendance_date->toDateString()),
                'source_type' => Attendance::class,
                'source_id' => $attendance->id,
                'dedupe_key' => "attendance-absence:{$attendance->id}:user:{$userId}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $created;
    }

    public function markRead(AppNotification $notification, int $userId): AppNotification
    {
        if (!$notification->read_at) {
            $notification->forceFill(['read_at' => now()])->save();
        }

        return $notification;
    }

    public function recipientIdsForCommunication(Communication $communication): array
    {
        if ($communication->audience === 'individual' && ! $communication->recipient_id) {
            return [];
        }

        $base = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.school_id', $communication->school_id)
            ->when($communication->recipient_id, fn ($query) => $query->where('user_roles.user_id', $communication->recipient_id))
            ->when(!$communication->recipient_id && $communication->audience !== 'all', function ($query) use ($communication) {
                if ($communication->audience === 'parents') {
                    $query->where('roles.slug', 'parent');
                } elseif ($communication->audience === 'students') {
                    $query->where('roles.slug', 'student');
                } else {
                    $query->whereNotIn('roles.slug', ['parent', 'student']);
                }
            })
            ->distinct()
            ->pluck('user_roles.user_id');

        return $base->map(fn ($id) => (int) $id)->values()->all();
    }
}

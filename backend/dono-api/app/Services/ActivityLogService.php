<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    /**
     * Log a user or system activity across the DONO ERP platform.
     *
     * $schoolId must be passed explicitly by the caller — resolved via
     * CurrentContextService at the call site, never guessed from the user
     * directly. Pass null for platform-level events not tied to one school.
     *
     * is_platform_action is set automatically based on whether the acting
     * user is a super admin — this is what keeps a software owner's own
     * actions out of a school's own audit view, while still letting the
     * platform owner see everything (including school-level activity).
     */
    public static function log(
        string $module,
        string $action,
        ?string $description = null,
        $subject = null,
        array $properties = [],
        ?int $schoolId = null
    ): ActivityLog {
        $user = Auth::user();

        return ActivityLog::create([
            'school_id'           => $schoolId,
            'user_id'             => $user?->id,
            'is_platform_action'  => $user?->isSuperAdmin() ?? false,
            'module'               => $module,
            'action'               => $action,
            'description'          => $description,
            'subject_type'         => $subject ? get_class($subject) : null,
            'subject_id'           => $subject?->id,
            'properties'           => $properties,
            'ip_address'           => Request::ip(),
            'user_agent'           => Request::userAgent(),
        ]);
    }
}

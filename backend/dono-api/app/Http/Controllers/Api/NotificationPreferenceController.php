<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use App\Services\CurrentContextService;
use App\Services\NotificationPreferenceService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationPreferenceController extends Controller
{
    public function __construct(
        private CurrentContextService $context,
        private NotificationPreferenceService $preferences,
    ) {}

    public function index(Request $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        return response()->json([
            'data' => NotificationPreference::query()
                ->where('user_id', $request->user()->id)
                ->where(function ($query) use ($schoolId) {
                    $query->whereNull('school_id');
                    if ($schoolId) $query->orWhere('school_id', $schoolId);
                })
                ->orderBy('school_id')
                ->orderBy('channel')
                ->orderBy('notification_type')
                ->get(),
            'school_id' => $schoolId,
        ]);
    }

    public function update(Request $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        $data = $request->validate([
            'school_id' => ['nullable', 'integer'],
            'notification_type' => ['required', 'string', 'max:80'],
            'channel' => ['required', Rule::in(['in_app', 'email', 'sms', 'push'])],
            'is_enabled' => ['required', 'boolean'],
        ]);
        $targetSchoolId = array_key_exists('school_id', $data) ? $data['school_id'] : $schoolId;
        abort_unless($targetSchoolId === null || (int) $targetSchoolId === (int) $schoolId, 403, 'You can only change preferences for the active school.');

        $preference = NotificationPreference::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'school_id' => $targetSchoolId,
                'notification_type' => $data['notification_type'],
                'channel' => $data['channel'],
            ],
            ['is_enabled' => $data['is_enabled']],
        );
        $this->preferences->forget($request->user()->id, $targetSchoolId, $preference->notification_type, $preference->channel);

        return response()->json(['data' => $preference, 'message' => 'Notification preference saved.']);
    }
}

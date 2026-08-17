<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
class ActivityLogController extends Controller {
    public function __construct(protected CurrentContextService $context) {}
    public function index(Request $request) {
        $user = $request->user();
        if ($user->isSuperAdmin()) {
            $schoolActivity = ActivityLog::where('is_platform_action', false)->with('user:id,name')->latest()->paginate(20);
            $platformActivity = ActivityLog::where('is_platform_action', true)->with('user:id,name')->latest()->paginate(20);
            return response()->json(['success' => true, 'school_activity' => $schoolActivity, 'platform_activity' => $platformActivity]);
        }
        $resolved = $this->context->resolve($user);
        $schoolId = $resolved['school']['id'] ?? null;
        if (!$schoolId) return response()->json(['success' => false, 'message' => 'No active school.'], 409);
        $logs = ActivityLog::where('school_id', $schoolId)->visibleToSchool()->with('user:id,name')->latest()->paginate(20);
        return response()->json(['success' => true, 'data' => $logs]);
    }
}

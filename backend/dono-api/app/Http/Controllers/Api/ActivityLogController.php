<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\CurrentContextService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = min(max($request->integer('per_page', 20), 5), 100);

        if ($user->isSuperAdmin()) {
            $schoolActivity = $this->filteredQuery($request, false)->paginate($perPage, ['*'], 'school_page');
            $platformActivity = $this->filteredQuery($request, true)->paginate($perPage, ['*'], 'platform_page');

            return response()->json([
                'success' => true,
                'school_activity' => $schoolActivity,
                'platform_activity' => $platformActivity,
            ]);
        }

        $resolved = $this->context->resolve($user);
        $schoolId = $resolved['school']['id'] ?? null;

        if (!$schoolId) {
            return response()->json(['success' => false, 'message' => 'No active school.'], 409);
        }

        $logs = $this->filteredQuery($request, false)
            ->where('school_id', $schoolId)
            ->visibleToSchool()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    private function filteredQuery(Request $request, bool $platform): Builder
    {
        return ActivityLog::query()
            ->where('is_platform_action', $platform)
            ->with('user:id,name')
            ->when($request->filled('date'), fn (Builder $query) => $query->whereDate('created_at', $request->string('date')->toString()))
            ->when($request->filled('from'), fn (Builder $query) => $query->whereDate('created_at', '>=', $request->string('from')->toString()))
            ->when($request->filled('to'), fn (Builder $query) => $query->whereDate('created_at', '<=', $request->string('to')->toString()))
            ->when($request->filled('module'), fn (Builder $query) => $query->where('module', $request->string('module')->toString()))
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $search = trim($request->string('search')->toString());
                $query->where(function (Builder $nested) use ($search) {
                    $nested->where('description', 'like', "%{$search}%")
                        ->orWhere('action', 'like', "%{$search}%")
                        ->orWhere('module', 'like', "%{$search}%")
                        ->orWhereHas('user', fn (Builder $user) => $user->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest();
    }
}

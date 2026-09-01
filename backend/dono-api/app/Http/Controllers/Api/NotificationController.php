<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private CurrentContextService $context) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = AppNotification::query()
            ->where('user_id', $user->id)
            ->where($this->contextFilters($user))
            ->when($request->boolean('unread_only'), fn ($builder) => $builder->whereNull('read_at'))
            ->latest('created_at');

        $page = $query->paginate($this->perPage($request));

        return response()->json([
            'data' => $page,
            'unread_count' => AppNotification::query()
                ->where('user_id', $user->id)
                ->where($this->contextFilters($user))
                ->whereNull('read_at')
                ->count(),
        ]);
    }

    public function markRead(Request $request, AppNotification $notification)
    {
        $this->ensureVisible($request->user(), $notification);
        $notification->forceFill(['read_at' => $notification->read_at ?: now()])->save();

        return response()->json(['data' => $notification->fresh(), 'message' => 'Notification marked as read.']);
    }

    public function markAllRead(Request $request)
    {
        $user = $request->user();
        AppNotification::query()
            ->where('user_id', $user->id)
            ->where($this->contextFilters($user))
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        return response()->json(['message' => 'Notifications marked as read.']);
    }

    private function contextFilters($user): array
    {
        if ($user->isSuperAdmin()) {
            return [];
        }

        $school = $this->context->currentSchool($user);
        if ($school) {
            return ['school_id' => $school->id];
        }

        $organization = $this->context->currentOrganization($user);
        if ($organization) {
            return ['organization_id' => $organization->id];
        }

        return ['school_id' => null, 'organization_id' => null];
    }

    private function ensureVisible($user, AppNotification $notification): void
    {
        abort_unless(
            (int) $notification->user_id === (int) $user->id
                && $this->matchesContext($user, $notification),
            404,
            'Notification not found.'
        );
    }

    private function matchesContext($user, AppNotification $notification): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        $school = $this->context->currentSchool($user);
        if ($school) {
            return (int) $notification->school_id === (int) $school->id;
        }

        $organization = $this->context->currentOrganization($user);
        if ($organization) {
            return (int) $notification->organization_id === (int) $organization->id;
        }

        return $notification->school_id === null && $notification->organization_id === null;
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 20), 1), 100);
    }
}

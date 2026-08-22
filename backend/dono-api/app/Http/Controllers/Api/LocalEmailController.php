<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LocalEmailMessage;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class LocalEmailController extends Controller
{
    public function index(Request $request)
    {
        $query = LocalEmailMessage::query()->latest();
        if ($request->filled('type')) {
            $query->where('message_type', $request->string('type')->toString());
        }
        if ($request->filled('email')) {
            $query->where('recipient_email', 'like', '%'.strtolower(trim($request->string('email')->toString())).'%');
        }

        return response()->json([
            'data' => $query->paginate(min(max($request->integer('per_page', 50), 1), 200)),
            'local_mode' => true,
        ]);
    }

    public function show(LocalEmailMessage $localEmailMessage)
    {
        return response()->json(['data' => $localEmailMessage]);
    }

    public function markRead(LocalEmailMessage $localEmailMessage)
    {
        $localEmailMessage->update(['read_at' => now()]);
        return response()->json(['data' => $localEmailMessage->fresh(), 'message' => 'Message marked as read.']);
    }

    public function clear()
    {
        $count = LocalEmailMessage::query()->count();
        LocalEmailMessage::query()->delete();
        ActivityLogService::log(module: 'platform_email', action: 'local_inbox_cleared', description: "The local Test Inbox was cleared ({$count} messages deleted).");
        return response()->json(['message' => "Local Test Inbox cleared. {$count} messages deleted."]);
    }
}

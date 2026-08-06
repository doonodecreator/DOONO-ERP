<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolSettingController extends Controller
{
    public function __construct(private CurrentContextService $context)
    {
    }

    public function show(Request $request)
    {
        $resolved = $this->context->resolve($request->user());
        $schoolId = $resolved['school']['id'] ?? null;

        if (!$schoolId) {
            return response()->json(['success' => false, 'message' => 'No active school.'], 409);
        }

        $settings = DB::table('school_settings')->where('school_id', $schoolId)->first();

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $resolved = $this->context->resolve($request->user());
        $schoolId = $resolved['school']['id'] ?? null;

        if (!$schoolId) {
            return response()->json(['success' => false, 'message' => 'No active school.'], 409);
        }

        $validated = $request->validate([
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'account_name' => 'nullable|string|max:255',
            'receipt_prefix' => 'nullable|string|max:10',
            'sms_sender_id' => 'nullable|string|max:11',
            'motto' => 'nullable|string|max:255',
            'paystack_public_key' => 'nullable|string|max:255',
            'paystack_secret_key' => 'nullable|string|max:255',
            'paystack_subaccount_code' => 'nullable|string|max:50',
        ]);

        DB::table('school_settings')->updateOrInsert(
            ['school_id' => $schoolId],
            array_merge($validated, ['updated_at' => now()])
        );

        return response()->json([
            'success' => true,
            'message' => 'School Settings updated successfully.',
            'data' => DB::table('school_settings')->where('school_id', $schoolId)->first(),
        ]);
    }
}


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

        $this->authorizeProprietorSettings($request, (int) $schoolId);
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

        $this->authorizeProprietorSettings($request, (int) $schoolId);
        $validated = $request->validate([
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'account_name' => 'nullable|string|max:255',
            'receipt_prefix' => 'nullable|string|max:10',
            'invoice_prefix' => ['nullable', 'string', 'max:12', 'regex:/^[A-Za-z0-9_-]+$/'],
            'tax_enabled' => ['sometimes', 'boolean'],
            'tax_name' => 'nullable|string|max:100',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'tax_identifier' => 'nullable|string|max:100',
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

    private function authorizeProprietorSettings(Request $request, int $schoolId): void
    {
        $user = $request->user();
        $school = $this->context->currentSchool($user);

        abort_unless(
            $school && (int) $school->id === $schoolId,
            409,
            'No active school.'
        );

        $isOwner = (int) $school->owner_id === (int) $user->id;
        $isProprietor = $user->isSuperAdmin() || $user->hasRole('proprietor', $schoolId);

        abort_unless($isOwner || $isProprietor, 403, 'Only the Proprietor may manage school settings.');
    }
}


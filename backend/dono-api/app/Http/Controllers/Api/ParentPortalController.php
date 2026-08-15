<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class ParentPortalController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {
    }

    public function dashboard(Request $request)
    {
        $schoolId = $this->currentSchoolId($request);

        $guardian = Guardian::with('students.class', 'students.division')
            ->where('school_id', $schoolId)
            ->where('user_id', $request->user()->id)
            ->first();

        abort_unless(
            $guardian,
            403,
            'No parent portal profile is linked to this account.'
        );

        return response()->json([
            'parent_profile' => $guardian,
            'children' => $guardian->students,
            'recent_notices' => [],
            'outstanding_fees' => null,
        ]);
    }

    private function currentSchoolId(Request $request): int
    {
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 409, 'No active school.');

        return (int) $schoolId;
    }
}

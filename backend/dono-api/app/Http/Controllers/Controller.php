<?php

namespace App\Http\Controllers;

use App\Services\CurrentContextService;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Resolve the authenticated user's active school through the single
     * application context service. Controllers must not derive school scope
     * from user fields, role ordering, or request payloads.
     */
    protected function schoolId(Request $request): ?int
    {
        return app(CurrentContextService::class)
            ->currentSchool($request->user())
            ?->id;
    }

    protected function requireSchool(Request $request): int
    {
        $schoolId = $this->schoolId($request);

        abort_unless($schoolId, 409, 'Select an active school before continuing.');

        return (int) $schoolId;
    }
}

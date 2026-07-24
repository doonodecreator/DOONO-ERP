<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSystemSettingRequest;
use App\Http\Resources\SystemSettingResource;
use App\Models\SystemSetting;

class SystemSettingController extends Controller
{
    /**
     * Display the platform settings.
     */
    public function index()
    {
        $settings = SystemSetting::with([
            'defaultSubscriptionPlan',
            'defaultCurrency',
        ])->firstOrFail();

        return new SystemSettingResource($settings);
    }

    /**
     * Update platform settings.
     */
    public function update(UpdateSystemSettingRequest $request)
    {
        $settings = SystemSetting::firstOrFail();

        $settings->update(
            $request->validated()
        );

        return new SystemSettingResource(
            $settings->fresh([
                'defaultSubscriptionPlan',
                'defaultCurrency',
            ])
        );
    }

    /**
     * Unused API methods.
     */
    public function store()
    {
        abort(405);
    }

    public function show()
    {
        abort(405);
    }

    public function destroy()
    {
        abort(405);
    }
}

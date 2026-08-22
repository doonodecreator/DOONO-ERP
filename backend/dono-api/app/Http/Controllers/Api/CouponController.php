<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCouponRequest;
use App\Http\Requests\UpdateCouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\DB;

class CouponController extends Controller
{
    /**
     * Display a listing of coupons.
     */
    public function index()
    {
        return CouponResource::collection(

            Coupon::with([
                'subscriptionPlans',
                'schools',
            ])

            ->latest()

            ->paginate(10)
        );
    }

    /**
     * Store a newly created coupon.
     */
    public function store(StoreCouponRequest $request)
    {
        $coupon = DB::transaction(function () use ($request) {

            $data = $request->validated();

            unset(
                $data['subscription_plans'],
                $data['schools']
            );

            $data['times_used'] = 0;

            $coupon = Coupon::create($data);

            if ($request->filled('subscription_plans')) {

                $coupon->subscriptionPlans()->sync(
                    $request->subscription_plans
                );
            }

            if ($request->filled('schools')) {

                $coupon->schools()->sync(
                    $request->schools
                );
            }

            return $coupon;
        });

        ActivityLogService::log(
            module: 'coupons',
            action: 'created',
            description: "Coupon \"{$coupon->code}\" was created.",
            subject: $coupon,
            properties: ['changed_fields' => array_keys($request->validated())],
        );

        return (new CouponResource(

            $coupon->load([
                'subscriptionPlans',
                'schools',
            ])

        ))

        ->response()

        ->setStatusCode(201);
    }

    /**
     * Display a coupon.
     */
    public function show(Coupon $coupon)
    {
        return new CouponResource(

            $coupon->load([
                'subscriptionPlans',
                'schools',
            ])

        );
    }

    /**
     * Update coupon.
     */
    public function update(
        UpdateCouponRequest $request,
        Coupon $coupon
    ) {

        DB::transaction(function () use ($request, $coupon) {

            $data = $request->validated();

            unset(
                $data['subscription_plans'],
                $data['schools']
            );

            $coupon->update($data);

            if ($request->has('subscription_plans')) {

                $coupon->subscriptionPlans()->sync(
                    $request->subscription_plans ?? []
                );
            }

            if ($request->has('schools')) {

                $coupon->schools()->sync(
                    $request->schools ?? []
                );
            }
        });

        ActivityLogService::log(
            module: 'coupons',
            action: 'updated',
            description: "Coupon \"{$coupon->code}\" was updated.",
            subject: $coupon,
            properties: ['changed_fields' => array_keys($request->validated())],
        );

        return new CouponResource(

            $coupon->fresh()->load([
                'subscriptionPlans',
                'schools',
            ])

        );
    }

    /**
     * Delete coupon.
     */
    public function destroy(Coupon $coupon)
    {
        $couponCode = $coupon->code;
        $couponId = $coupon->id;
        $coupon->delete();

        ActivityLogService::log(
            module: 'coupons',
            action: 'deleted',
            description: "Coupon \"{$couponCode}\" was deleted.",
            properties: ['coupon_id' => $couponId],
        );

        return response()->json([
            'message' => 'Coupon deleted successfully.',
        ]);
    }
}

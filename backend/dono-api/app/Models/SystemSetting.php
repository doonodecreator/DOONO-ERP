<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    protected $fillable = [
        'platform_name', 'platform_email', 'platform_phone', 'platform_logo',
        'trial_days', 'default_subscription_plan_id', 'default_currency_id',
        'allow_school_registration', 'maintenance_mode', 'enforce_subscriptions',
        'paystack_enabled', 'stripe_enabled', 'email_notifications', 'local_email_mode', 'sms_notifications',
    ];

    protected $casts = [
        'allow_school_registration' => 'boolean',
        'maintenance_mode' => 'boolean',
        'enforce_subscriptions' => 'boolean',
        'paystack_enabled' => 'boolean',
        'stripe_enabled' => 'boolean',
        'email_notifications' => 'boolean',
        'local_email_mode' => 'boolean',
        'sms_notifications' => 'boolean',
    ];

    public function defaultSubscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'default_subscription_plan_id');
    }

    public function defaultCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'default_currency_id');
    }
}

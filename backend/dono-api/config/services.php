<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Paystack
    |--------------------------------------------------------------------------
    */

    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        'from' => env('TWILIO_FROM'),
        'messaging_service_sid' => env('TWILIO_MESSAGING_SERVICE_SID'),
        'status_callback_url' => env('TWILIO_STATUS_CALLBACK_URL'),
        'webhook_url' => env('TWILIO_WEBHOOK_URL'),
    ],

    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
        'service_account_json' => env('FIREBASE_SERVICE_ACCOUNT_JSON'),
        'service_account_path' => env('GOOGLE_APPLICATION_CREDENTIALS'),
    ],

    'ai' => [
        'enabled' => (bool) env('AI_ENABLED', false),
        'base_url' => rtrim((string) env('AI_BASE_URL', 'https://api.openai.com/v1'), '/'),
        'api_key' => env('AI_API_KEY'),
        'model' => env('AI_MODEL', 'gpt-5-mini'),
        'max_completion_tokens' => (int) env('AI_MAX_COMPLETION_TOKENS', 1200),
    ],

    'live_rooms' => [
        'enabled' => (bool) env('LIVE_ROOMS_ENABLED', false),
        'provider' => env('LIVE_ROOMS_PROVIDER'),
        'base_url' => rtrim((string) env('LIVE_ROOMS_PROVIDER_BASE_URL', ''), '/'),
        'public_url' => rtrim((string) env('LIVE_ROOMS_PROVIDER_PUBLIC_URL', ''), '/'),
        'api_key' => env('LIVE_ROOMS_PROVIDER_API_KEY'),
        'api_secret' => env('LIVE_ROOMS_PROVIDER_API_SECRET'),
        'webhook_secret' => env('LIVE_ROOMS_PROVIDER_WEBHOOK_SECRET'),
        'recording_enabled' => (bool) env('LIVE_ROOMS_RECORDING_ENABLED', false),
        'recording_bucket' => env('LIVE_ROOMS_RECORDING_S3_BUCKET'),
        'recording_region' => env('LIVE_ROOMS_RECORDING_S3_REGION', env('AWS_DEFAULT_REGION', 'us-east-1')),
        'recording_s3_endpoint' => env('LIVE_ROOMS_RECORDING_S3_ENDPOINT'),
        'recording_access_key' => env('LIVE_ROOMS_RECORDING_S3_ACCESS_KEY', env('AWS_ACCESS_KEY_ID')),
        'recording_secret' => env('LIVE_ROOMS_RECORDING_S3_SECRET', env('AWS_SECRET_ACCESS_KEY')),
        'recording_retention_days' => max(1, min((int) env('LIVE_ROOMS_RECORDING_RETENTION_DAYS', 30), 3650)),
        'adapter_ready' => (bool) env('LIVE_ROOMS_ADAPTER_READY', false),
    ],

    'paystack' => [

        'public_key' => env('PAYSTACK_PUBLIC_KEY'),

        'secret_key' => env('PAYSTACK_SECRET_KEY'),

        'payment_url' => env(
            'PAYSTACK_PAYMENT_URL',
            'https://api.paystack.co'
        ),

        'callback_url' => env('PAYSTACK_CALLBACK_URL'),

        // Must match a currency enabled for this Paystack merchant account.
        'currency' => strtoupper((string) env('PAYSTACK_CURRENCY', 'NGN')),
    ],

];

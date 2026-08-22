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

<?php

return [
    'rate_limits' => [
        'api_per_minute' => (int) env('DONO_API_RATE_LIMIT', 120),
        'auth_per_minute' => (int) env('DONO_AUTH_RATE_LIMIT', 10),
    ],
];

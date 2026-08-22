<?php

$configuredOrigins = trim((string) env('CORS_ALLOWED_ORIGINS', ''));
$frontendOrigin = trim((string) env('FRONTEND_URL', ''));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $configuredOrigins !== ''
        ? array_values(array_filter(array_map('trim', explode(',', $configuredOrigins))))
        : ($frontendOrigin !== '' ? [$frontendOrigin] : ['http://localhost:5173']),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Configure CORS for API endpoints. In production, restrict origins to the
    | public frontend domain and allow credentials for cookie-based auth flows.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Allow all methods for API
    'allowed_methods' => ['*'],

    // Restrict to the public site origin
    'allowed_origins' => ['https://diceway.com', 'https://www.diceway.com'],

    'allowed_origins_patterns' => [],

    // Typical headers sent by the SPA
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],

    'exposed_headers' => [],

    // Cache preflight for 1 day
    'max_age' => 86400,

    // Allow credentials (needed for some flows like Sanctum or cookie-based endpoints)
    'supports_credentials' => true,

];

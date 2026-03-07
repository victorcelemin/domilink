package com.domilink.auth.config;

/**
 * CORS is handled exclusively by the API Gateway (Spring Cloud Gateway globalcors).
 * This file is intentionally empty — do NOT add a CorsFilter bean here.
 *
 * Adding a CorsFilter in microservices causes duplicate Access-Control-Allow-Origin
 * headers when the gateway and the service both append the header, which browsers
 * reject as invalid.
 */
public class CorsConfig {
    // No beans — CORS is gateway-only
}

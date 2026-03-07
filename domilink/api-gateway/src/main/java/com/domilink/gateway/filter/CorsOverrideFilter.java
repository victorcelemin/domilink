package com.domilink.gateway.filter;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

/**
 * Filtro global que resuelve el problema de cabeceras CORS duplicadas en Cloud Run.
 *
 * Problema:
 *   Cloud Run agrega automaticamente 'Access-Control-Allow-Origin: *' a toda respuesta.
 *   Spring Cloud Gateway tambien agrega su propio valor especifico del origen.
 *   El browser recibe dos valores separados por coma y lo rechaza con CORS error.
 *
 * Solucion:
 *   Este filtro se ejecuta DESPUES de que Spring Gateway procesa la respuesta
 *   y SOBREESCRIBE la cabecera CORS con un unico valor correcto basado en el
 *   header 'Origin' de la peticion original.
 *
 *   Orden = Ordered.LOWEST_PRECEDENCE para ejecutarse al final de la cadena
 *   (tras los filtros de Spring Gateway que ya determinaron el origen permitido).
 */
@Component
public class CorsOverrideFilter implements GlobalFilter, Ordered {

    private static final List<String> ALLOWED_ORIGINS = Arrays.asList(
            "https://domilink-mobile.vercel.app"
    );

    private static final String ALLOW_ALL = "*";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            HttpHeaders responseHeaders = exchange.getResponse().getHeaders();
            String requestOrigin = exchange.getRequest().getHeaders().getOrigin();

            // Determinar el valor correcto del origen
            String allowedOrigin;
            if (requestOrigin != null && ALLOWED_ORIGINS.contains(requestOrigin)) {
                allowedOrigin = requestOrigin;
            } else if (requestOrigin != null && isLocalOrigin(requestOrigin)) {
                // Desarrollo local: permitir cualquier localhost
                allowedOrigin = requestOrigin;
            } else {
                // Sin origen o desconocido: no emitir cabecera restrictiva
                // (Cloud Run ya puso '*', dejamos que el DedupeResponseHeader lo maneje)
                return;
            }

            // Sobreescribir — esto reemplaza TODOS los valores actuales con uno solo
            try {
                responseHeaders.set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, allowedOrigin);

                // Para preflight OPTIONS: asegurar que las demas cabeceras CORS esten presentes
                if (exchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
                    responseHeaders.set(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                            "GET, POST, PUT, DELETE, OPTIONS, PATCH");
                    responseHeaders.set(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "*");
                    responseHeaders.set(HttpHeaders.ACCESS_CONTROL_MAX_AGE, "3600");
                    exchange.getResponse().setStatusCode(HttpStatus.OK);
                }
            } catch (Exception ignored) {
                // Las cabeceras pueden ser read-only si la respuesta ya esta committed
            }
        }));
    }

    private boolean isLocalOrigin(String origin) {
        return origin.startsWith("http://localhost")
                || origin.startsWith("http://10.0.2.2")
                || origin.startsWith("http://192.168.");
    }

    @Override
    public int getOrder() {
        // Ejecutar despues de todos los filtros de gateway pero antes de enviar al cliente
        return Ordered.LOWEST_PRECEDENCE - 10;
    }
}

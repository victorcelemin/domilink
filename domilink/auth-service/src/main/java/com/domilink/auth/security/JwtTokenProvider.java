package com.domilink.auth.security;

import com.domilink.auth.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * Componente para generar y validar tokens JWT.
 * El mismo secret debe estar configurado en el API Gateway.
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /**
     * Genera un JWT firmado con los claims del usuario.
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .setSubject(user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("status", user.getStatus().name())
                .claim("displayName", user.getDisplayName())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .setIssuer("domilink-auth-service")
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extrae el ID del usuario del token JWT.
     */
    public String getUserIdFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Extrae el rol del usuario del token JWT.
     */
    public String getRoleFromToken(String token) {
        return parseClaims(token).get("role", String.class);
    }

    /**
     * Valida que el token sea correcto y no este expirado.
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (MalformedJwtException e) {
            log.error("Token JWT malformado: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Token JWT expirado: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Token JWT no soportado: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims vacio: {}", e.getMessage());
        }
        return false;
    }

    public long getExpirationMs() {
        return jwtExpiration;
    }

    private Claims parseClaims(String token) {
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}

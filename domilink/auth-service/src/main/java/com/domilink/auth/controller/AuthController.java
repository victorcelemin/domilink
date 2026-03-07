package com.domilink.auth.controller;

import com.domilink.auth.dto.AuthResponse;
import com.domilink.auth.dto.LoginRequest;
import com.domilink.auth.dto.RegisterRequest;
import com.domilink.auth.model.User;
import com.domilink.auth.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST del Auth Service.
 *
 * Endpoints:
 * POST /api/auth/register  - Registro de empresa o domiciliario
 * POST /api/auth/login     - Login con email/password
 * GET  /api/auth/me        - Informacion del usuario autenticado (via headers del gateway)
 * PUT  /api/auth/users/{id}/status - Actualizar estado (solo ADMIN)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registra un nuevo usuario.
     * Acceso: Publico
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Solicitud de registro para: {} con rol: {}", request.getEmail(), request.getRole());
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Autentica un usuario con email/password.
     * Si las credenciales son correctas, genera un OTP y lo retorna en la respuesta
     * con requiresOtp=true. El frontend debe redirigir al paso de verificacion OTP.
     * Usuarios de prueba (TEST) omiten el paso 2FA y reciben el JWT directamente.
     * Acceso: Publico
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Solicitud de login para: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Solicita un nuevo codigo OTP para el email indicado.
     * Llamar despues de un login exitoso (credenciales validas) para iniciar 2FA.
     * Acceso: Publico
     */
    @PostMapping("/otp/send")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El campo 'email' es obligatorio"));
        }
        // En dev el OTP se retorna en la respuesta para facilitar pruebas.
        // En produccion omitir 'otp' de la respuesta y enviarlo por email/SMS.
        String otp = authService.generateOtp(email.trim().toLowerCase());
        log.info("OTP enviado (simulado) a: {}", email);
        return ResponseEntity.ok(Map.of(
                "message", "Codigo OTP enviado al correo registrado",
                "otp", otp   // SOLO para desarrollo — eliminar en produccion
        ));
    }

    /**
     * Verifica el codigo OTP y, si es correcto, retorna el JWT final.
     * Acceso: Publico
     */
    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp   = body.get("otp");
        if (email == null || otp == null) {
            throw new RuntimeException("Los campos 'email' y 'otp' son obligatorios");
        }
        AuthResponse response = authService.verifyOtp(email.trim().toLowerCase(), otp.trim());
        return ResponseEntity.ok(response);
    }

    /**
     * Retorna informacion del usuario actualmente autenticado.
     * El API Gateway inyecta los headers X-User-Id, X-User-Role, X-User-Email.
     * Acceso: Autenticado
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email) {

        User user = authService.getUserById(userId);

        return ResponseEntity.ok(Map.of(
                "id", userId,
                "email", email,
                "role", role,
                "status", user.getStatus(),
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : ""
        ));
    }

    /**
     * Actualiza el estado de un usuario (aprobar/suspender/rechazar).
     * Acceso: Solo ADMIN
     */
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable String userId,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Role") String requesterRole) {

        if (!"ADMIN".equals(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Solo los administradores pueden cambiar estados"));
        }

        String newStatusStr = body.get("status");
        if (newStatusStr == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El campo 'status' es obligatorio"));
        }

        User.UserStatus newStatus;
        try {
            newStatus = User.UserStatus.valueOf(newStatusStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Estado invalido. Valores permitidos: ACTIVE, SUSPENDED, REJECTED, PENDING_VERIFICATION"));
        }

        User updated = authService.updateUserStatus(userId, newStatus);
        return ResponseEntity.ok(Map.of(
                "userId", updated.getId(),
                "status", updated.getStatus(),
                "message", "Estado actualizado exitosamente"
        ));
    }

    /**
     * Health check del servicio.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "service", "auth-service",
                "status", "UP"
        ));
    }

    // Manejador de excepciones local
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        log.warn("Error en AuthController: {}", e.getMessage());
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

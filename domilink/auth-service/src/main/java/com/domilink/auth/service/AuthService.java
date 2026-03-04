package com.domilink.auth.service;

import com.domilink.auth.dto.AuthResponse;
import com.domilink.auth.dto.LoginRequest;
import com.domilink.auth.dto.RegisterRequest;
import com.domilink.auth.model.User;
import com.domilink.auth.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de autenticacion principal.
 *
 * Estrategia de almacenamiento:
 * - Desarrollo local: ConcurrentHashMap en memoria (se pierde al reiniciar)
 * - Produccion: Firestore (coleccion "users")
 *
 * La capa de repositorio esta desacoplada para facilitar el cambio.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final FirebaseService firebaseService;

    // Almacenamiento en memoria para desarrollo local
    // En produccion reemplazar con FirestoreUserRepository
    private final Map<String, User> usersByEmail = new ConcurrentHashMap<>();
    private final Map<String, User> usersById = new ConcurrentHashMap<>();

    public AuthService(JwtTokenProvider jwtTokenProvider,
                       PasswordEncoder passwordEncoder,
                       FirebaseService firebaseService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.firebaseService = firebaseService;
    }

    /**
     * Registra un nuevo usuario en la plataforma.
     * Crea el usuario localmente y opcionalmente en Firebase.
     */
    public AuthResponse register(RegisterRequest request) {
        // Verificar que el email no exista
        if (usersByEmail.containsKey(request.getEmail().toLowerCase())) {
            throw new RuntimeException("El email ya esta registrado: " + request.getEmail());
        }

        // Solo COMPANY y COURIER pueden registrarse publicamente
        if (request.getRole() == User.UserRole.ADMIN) {
            throw new RuntimeException("No se puede registrar como ADMIN por esta via");
        }

        String userId;

        // Intentar crear en Firebase si esta disponible
        String firebaseUid = firebaseService.createFirebaseUser(
                request.getEmail(),
                request.getPassword(),
                request.getDisplayName()
        );

        userId = (firebaseUid != null) ? firebaseUid : UUID.randomUUID().toString();

        // Crear usuario local
        User user = new User(userId, request.getEmail().toLowerCase(), request.getRole());
        user.setDisplayName(request.getDisplayName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(User.UserStatus.PENDING_VERIFICATION);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Persistir (en produccion esto va a Firestore)
        usersByEmail.put(user.getEmail(), user);
        usersById.put(user.getId(), user);

        log.info("Usuario registrado: {} con rol: {}", user.getEmail(), user.getRole());

        // Generar JWT
        String token = jwtTokenProvider.generateToken(user);

        return new AuthResponse(
                token,
                jwtTokenProvider.getExpirationMs(),
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getStatus()
        );
    }

    /**
     * Autentica un usuario con email y password.
     */
    public AuthResponse login(LoginRequest request) {
        User user = usersByEmail.get(request.getEmail().toLowerCase());

        if (user == null) {
            throw new RuntimeException("Credenciales invalidas");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Credenciales invalidas");
        }

        if (user.getStatus() == User.UserStatus.SUSPENDED) {
            throw new RuntimeException("La cuenta esta suspendida. Contacte al administrador.");
        }

        if (user.getStatus() == User.UserStatus.REJECTED) {
            throw new RuntimeException("La cuenta fue rechazada. Los documentos no fueron aprobados.");
        }

        log.info("Login exitoso para: {}", user.getEmail());

        String token = jwtTokenProvider.generateToken(user);

        return new AuthResponse(
                token,
                jwtTokenProvider.getExpirationMs(),
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getStatus()
        );
    }

    /**
     * Obtiene un usuario por ID.
     */
    public User getUserById(String userId) {
        User user = usersById.get(userId);
        if (user == null) {
            throw new RuntimeException("Usuario no encontrado: " + userId);
        }
        return user;
    }

    /**
     * Actualiza el estado de un usuario (solo ADMIN).
     */
    public User updateUserStatus(String userId, User.UserStatus newStatus) {
        User user = getUserById(userId);
        user.setStatus(newStatus);
        user.setUpdatedAt(LocalDateTime.now());
        log.info("Estado de usuario {} actualizado a: {}", userId, newStatus);
        return user;
    }
}

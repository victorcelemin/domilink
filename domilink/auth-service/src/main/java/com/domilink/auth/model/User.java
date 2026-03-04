package com.domilink.auth.model;

import java.time.LocalDateTime;

/**
 * Modelo de usuario interno del Auth Service.
 * En Firestore se guarda en la coleccion "users".
 */
public class User {

    private String id;           // Firebase UID o UUID generado
    private String email;
    private String passwordHash; // Solo para auth local (no se usa si Firebase maneja el password)
    private UserRole role;
    private UserStatus status;
    private String displayName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum UserRole {
        COMPANY,    // Empresa que publica pedidos
        COURIER,    // Domiciliario que toma pedidos
        ADMIN       // Administrador de la plataforma
    }

    public enum UserStatus {
        PENDING_VERIFICATION,  // Recien registrado, pendiente de verificacion
        ACTIVE,                // Verificado y activo
        SUSPENDED,             // Suspendido por el admin
        REJECTED               // Documentos rechazados
    }

    // Constructor por defecto requerido por Firestore
    public User() {}

    public User(String id, String email, UserRole role) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.status = UserStatus.PENDING_VERIFICATION;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

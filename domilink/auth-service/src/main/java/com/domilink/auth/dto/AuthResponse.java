package com.domilink.auth.dto;

import com.domilink.auth.model.User;

public class AuthResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private String userId;
    private String email;
    private User.UserRole role;
    private User.UserStatus status;
    /** true cuando el login fue exitoso pero aun falta verificar el OTP (2FA). */
    private boolean requiresOtp;

    public AuthResponse() {}

    public AuthResponse(String accessToken, long expiresIn, String userId,
                        String email, User.UserRole role, User.UserStatus status) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.status = status;
        this.requiresOtp = false;
    }

    /** Constructor para respuesta que requiere OTP (sin token todavia). */
    public AuthResponse(String email, User.UserRole role, User.UserStatus status, boolean requiresOtp) {
        this.email = email;
        this.role = role;
        this.status = status;
        this.requiresOtp = requiresOtp;
    }

    // Getters y Setters
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public User.UserRole getRole() { return role; }
    public void setRole(User.UserRole role) { this.role = role; }

    public User.UserStatus getStatus() { return status; }
    public void setStatus(User.UserStatus status) { this.status = status; }

    public boolean isRequiresOtp() { return requiresOtp; }
    public void setRequiresOtp(boolean requiresOtp) { this.requiresOtp = requiresOtp; }
}

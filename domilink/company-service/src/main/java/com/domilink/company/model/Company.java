package com.domilink.company.model;

import java.time.LocalDateTime;

/**
 * Modelo de empresa en DomiLink.
 * Persistido en Firestore, coleccion "companies".
 */
public class Company {

    private String id;
    private String userId;          // ID del usuario dueno (del Auth Service)
    private String name;
    private String nit;             // Numero de identificacion tributaria
    private String email;
    private String phone;
    private String address;
    private String city;
    private double latitude;
    private double longitude;
    private String description;
    private String logoUrl;         // URL en Cloud Storage
    private CompanyStatus status;
    private String rejectionReason; // Si fue rechazada
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum CompanyStatus {
        PENDING,    // Pendiente de revision por admin
        ACTIVE,     // Aprobada y activa
        SUSPENDED,  // Suspendida por el admin
        REJECTED    // Rechazada con motivo
    }

    public Company() {}

    public Company(String id, String userId, String name, String nit, String email) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.nit = nit;
        this.email = email;
        this.status = CompanyStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNit() { return nit; }
    public void setNit(String nit) { this.nit = nit; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public CompanyStatus getStatus() { return status; }
    public void setStatus(CompanyStatus status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

package com.domilink.courier.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Modelo de domiciliario en DomiLink.
 * Persistido en Firestore, coleccion "couriers".
 */
public class Courier {

    private String id;
    private String userId;              // ID del usuario (del Auth Service)
    private String firstName;
    private String lastName;
    private String documentNumber;      // Cedula de ciudadania
    private String phone;
    private String email;
    private VehicleType vehicleType;
    private String vehiclePlate;        // Placa del vehiculo
    private String vehicleModel;
    private CourierStatus status;
    private boolean available;          // Disponible para tomar pedidos ahora
    private double currentLatitude;
    private double currentLongitude;
    private double rating;              // Calificacion promedio (0-5)
    private int totalDeliveries;
    // URLs en Cloud Storage
    private String documentPhotoUrl;    // Foto de cedula
    private String selfieUrl;           // Selfie del domiciliario
    private String certificateUrl;      // Certificado de antecedentes
    private List<String> certifications; // Certificaciones adicionales
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum VehicleType {
        MOTORCYCLE,
        BICYCLE,
        WALKING,        // A pie (para distancias cortas)
        CAR
    }

    public enum CourierStatus {
        PENDING_VERIFICATION,  // Documentos subidos, esperando revision
        ACTIVE,                // Verificado y activo
        SUSPENDED,             // Suspendido temporalmente
        REJECTED               // Documentos rechazados
    }

    public Courier() {}

    public Courier(String id, String userId, String firstName, String lastName, String documentNumber) {
        this.id = id;
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.documentNumber = documentNumber;
        // Dev: activar directamente. En produccion cambiar a PENDING_VERIFICATION
        this.status = CourierStatus.ACTIVE;
        this.available = false;
        this.rating = 0.0;
        this.totalDeliveries = 0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public VehicleType getVehicleType() { return vehicleType; }
    public void setVehicleType(VehicleType vehicleType) { this.vehicleType = vehicleType; }

    public String getVehiclePlate() { return vehiclePlate; }
    public void setVehiclePlate(String vehiclePlate) { this.vehiclePlate = vehiclePlate; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public CourierStatus getStatus() { return status; }
    public void setStatus(CourierStatus status) { this.status = status; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public double getCurrentLatitude() { return currentLatitude; }
    public void setCurrentLatitude(double currentLatitude) { this.currentLatitude = currentLatitude; }

    public double getCurrentLongitude() { return currentLongitude; }
    public void setCurrentLongitude(double currentLongitude) { this.currentLongitude = currentLongitude; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public int getTotalDeliveries() { return totalDeliveries; }
    public void setTotalDeliveries(int totalDeliveries) { this.totalDeliveries = totalDeliveries; }

    public String getDocumentPhotoUrl() { return documentPhotoUrl; }
    public void setDocumentPhotoUrl(String documentPhotoUrl) { this.documentPhotoUrl = documentPhotoUrl; }

    public String getSelfieUrl() { return selfieUrl; }
    public void setSelfieUrl(String selfieUrl) { this.selfieUrl = selfieUrl; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }

    public List<String> getCertifications() { return certifications; }
    public void setCertifications(List<String> certifications) { this.certifications = certifications; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

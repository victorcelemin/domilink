package com.domilink.order.model;

import java.time.LocalDateTime;

/**
 * Modelo de pedido en DomiLink.
 * Persistido en Firestore, coleccion "orders".
 *
 * Ciclo de vida de un pedido:
 * PENDING -> ASSIGNED -> IN_TRANSIT -> DELIVERED
 *                    \-> CANCELLED
 */
public class Order {

    private String id;
    private String companyId;           // ID de la empresa que crea el pedido
    private String companyUserId;       // User ID del dueno de la empresa
    private String courierId;           // ID del domiciliario (asignado)
    private String courierUserId;       // User ID del domiciliario

    // Origen (empresa / punto de recogida)
    private String pickupAddress;
    private double pickupLatitude;
    private double pickupLongitude;

    // Destino (cliente)
    private String deliveryAddress;
    private double deliveryLatitude;
    private double deliveryLongitude;

    // Informacion del pedido
    private String description;
    private String recipientName;
    private String recipientPhone;
    private PackageSize packageSize;

    // Modo de pago
    private PaymentMode paymentMode;    // BASE o PAID
    private Double baseAmount;          // Monto que lleva el domiciliario en modo BASE (null si PAID)

    // Calculo de precio
    private double distanceKm;          // Distancia calculada con Haversine
    private double basePrice;
    private double finalPrice;
    private String vehicleTypeUsed;     // Tipo de vehiculo del domiciliario asignado

    // Estado y timestamps
    private OrderStatus status;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private LocalDateTime assignedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime updatedAt;

    // Calificacion post-entrega
    private Integer courierRating;      // 1-5, dado por la empresa
    private String ratingComment;

    public enum OrderStatus {
        PENDING,        // Creado, esperando domiciliario
        ASSIGNED,       // Domiciliario asignado
        IN_TRANSIT,     // Domiciliario recogió el paquete
        DELIVERED,      // Entregado exitosamente
        CANCELLED       // Cancelado
    }

    public enum PackageSize {
        SMALL,          // Sobre, documentos
        MEDIUM,         // Caja pequena
        LARGE,          // Caja grande
        EXTRA_LARGE     // Paquete grande (puede tener recargo)
    }

    /**
     * Modo de pago del domicilio:
     * - BASE: el domiciliario lleva dinero para pagar el domicilio y retiene su comision.
     * - PAID: el pago ya fue realizado; el domiciliario solo entrega el paquete.
     */
    public enum PaymentMode {
        BASE,
        PAID
    }

    public Order() {}

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }

    public String getCompanyUserId() { return companyUserId; }
    public void setCompanyUserId(String companyUserId) { this.companyUserId = companyUserId; }

    public String getCourierId() { return courierId; }
    public void setCourierId(String courierId) { this.courierId = courierId; }

    public String getCourierUserId() { return courierUserId; }
    public void setCourierUserId(String courierUserId) { this.courierUserId = courierUserId; }

    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

    public double getPickupLatitude() { return pickupLatitude; }
    public void setPickupLatitude(double pickupLatitude) { this.pickupLatitude = pickupLatitude; }

    public double getPickupLongitude() { return pickupLongitude; }
    public void setPickupLongitude(double pickupLongitude) { this.pickupLongitude = pickupLongitude; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public double getDeliveryLatitude() { return deliveryLatitude; }
    public void setDeliveryLatitude(double deliveryLatitude) { this.deliveryLatitude = deliveryLatitude; }

    public double getDeliveryLongitude() { return deliveryLongitude; }
    public void setDeliveryLongitude(double deliveryLongitude) { this.deliveryLongitude = deliveryLongitude; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }

    public PackageSize getPackageSize() { return packageSize; }
    public void setPackageSize(PackageSize packageSize) { this.packageSize = packageSize; }

    public PaymentMode getPaymentMode() { return paymentMode; }
    public void setPaymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; }

    public Double getBaseAmount() { return baseAmount; }
    public void setBaseAmount(Double baseAmount) { this.baseAmount = baseAmount; }

    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    public double getBasePrice() { return basePrice; }
    public void setBasePrice(double basePrice) { this.basePrice = basePrice; }

    public double getFinalPrice() { return finalPrice; }
    public void setFinalPrice(double finalPrice) { this.finalPrice = finalPrice; }

    public String getVehicleTypeUsed() { return vehicleTypeUsed; }
    public void setVehicleTypeUsed(String vehicleTypeUsed) { this.vehicleTypeUsed = vehicleTypeUsed; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public LocalDateTime getPickedUpAt() { return pickedUpAt; }
    public void setPickedUpAt(LocalDateTime pickedUpAt) { this.pickedUpAt = pickedUpAt; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Integer getCourierRating() { return courierRating; }
    public void setCourierRating(Integer courierRating) { this.courierRating = courierRating; }

    public String getRatingComment() { return ratingComment; }
    public void setRatingComment(String ratingComment) { this.ratingComment = ratingComment; }
}

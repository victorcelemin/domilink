package com.domilink.order.dto;

import com.domilink.order.model.Order;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

public class CreateOrderRequest {

    @NotBlank(message = "La direccion de recogida es obligatoria")
    private String pickupAddress;

    @NotNull(message = "La latitud de recogida es obligatoria")
    private Double pickupLatitude;

    @NotNull(message = "La longitud de recogida es obligatoria")
    private Double pickupLongitude;

    @NotBlank(message = "La direccion de entrega es obligatoria")
    private String deliveryAddress;

    @NotNull(message = "La latitud de entrega es obligatoria")
    private Double deliveryLatitude;

    @NotNull(message = "La longitud de entrega es obligatoria")
    private Double deliveryLongitude;

    @NotBlank(message = "La descripcion del pedido es obligatoria")
    private String description;

    @NotBlank(message = "El nombre del destinatario es obligatorio")
    private String recipientName;

    @NotBlank(message = "El telefono del destinatario es obligatorio")
    private String recipientPhone;

    @NotNull(message = "El tamano del paquete es obligatorio")
    private Order.PackageSize packageSize;

    @NotNull(message = "El modo de pago es obligatorio")
    private Order.PaymentMode paymentMode; // BASE o PAID

    // Solo para modo BASE: monto que llevara el domiciliario
    private Double baseAmount;

    // Getters y Setters
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

    public Double getPickupLatitude() { return pickupLatitude; }
    public void setPickupLatitude(Double pickupLatitude) { this.pickupLatitude = pickupLatitude; }

    public Double getPickupLongitude() { return pickupLongitude; }
    public void setPickupLongitude(Double pickupLongitude) { this.pickupLongitude = pickupLongitude; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public Double getDeliveryLatitude() { return deliveryLatitude; }
    public void setDeliveryLatitude(Double deliveryLatitude) { this.deliveryLatitude = deliveryLatitude; }

    public Double getDeliveryLongitude() { return deliveryLongitude; }
    public void setDeliveryLongitude(Double deliveryLongitude) { this.deliveryLongitude = deliveryLongitude; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }

    public Order.PackageSize getPackageSize() { return packageSize; }
    public void setPackageSize(Order.PackageSize packageSize) { this.packageSize = packageSize; }

    public Order.PaymentMode getPaymentMode() { return paymentMode; }
    public void setPaymentMode(Order.PaymentMode paymentMode) { this.paymentMode = paymentMode; }

    public Double getBaseAmount() { return baseAmount; }
    public void setBaseAmount(Double baseAmount) { this.baseAmount = baseAmount; }
}

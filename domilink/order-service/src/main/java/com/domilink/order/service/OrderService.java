package com.domilink.order.service;

import com.domilink.order.dto.CreateOrderRequest;
import com.domilink.order.model.Order;
import com.domilink.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio de gestion de pedidos.
 *
 * Flujo completo:
 * 1. Empresa crea pedido (PENDING)
 * 2. Domiciliario toma el pedido (ASSIGNED)
 * 3. Domiciliario recoge el paquete (IN_TRANSIT)
 * 4. Entrega completada (DELIVERED)
 * 5. Empresa califica al domiciliario
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final HaversineService haversineService;
    private final PricingService pricingService;
    private final WebClient.Builder webClientBuilder;

    @Value("${services.courier-service-url:http://courier-service:8083}")
    private String courierServiceUrl;

    public OrderService(OrderRepository orderRepository,
                        HaversineService haversineService,
                        PricingService pricingService,
                        WebClient.Builder webClientBuilder) {
        this.orderRepository = orderRepository;
        this.haversineService = haversineService;
        this.pricingService = pricingService;
        this.webClientBuilder = webClientBuilder;
    }

    /**
     * Crea un pedido. Solo empresas ACTIVAS pueden crear pedidos.
     * Calcula automaticamente la distancia y el precio.
     */
    public Order createOrder(String companyUserId, String companyId, CreateOrderRequest request) {
        if (companyId == null || companyId.isBlank()) {
            throw new RuntimeException("Se requiere el ID de la empresa para crear un pedido");
        }

        // Calcular distancia con Haversine
        double distanceKm = haversineService.calculateDistance(
                request.getPickupLatitude(), request.getPickupLongitude(),
                request.getDeliveryLatitude(), request.getDeliveryLongitude()
        );

        // Precio base (sin vehiculo asignado aun, usar MOTORCYCLE como referencia)
        double estimatedPrice = pricingService.calculatePrice(
                distanceKm, "MOTORCYCLE", request.getPackageSize());

        String orderId = UUID.randomUUID().toString();
        Order order = new Order();
        order.setId(orderId);
        order.setCompanyId(companyId);
        order.setCompanyUserId(companyUserId);
        order.setPickupAddress(request.getPickupAddress());
        order.setPickupLatitude(request.getPickupLatitude());
        order.setPickupLongitude(request.getPickupLongitude());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setDeliveryLatitude(request.getDeliveryLatitude());
        order.setDeliveryLongitude(request.getDeliveryLongitude());
        order.setDescription(request.getDescription());
        order.setRecipientName(request.getRecipientName());
        order.setRecipientPhone(request.getRecipientPhone());
        order.setPackageSize(request.getPackageSize());
        order.setDistanceKm(distanceKm);
        order.setBasePrice(estimatedPrice);
        order.setFinalPrice(estimatedPrice); // Se recalcula al asignar domiciliario
        Order.PaymentMode paymentMode = request.getPaymentMode() != null
                ? request.getPaymentMode()
                : Order.PaymentMode.PAID;
        order.setPaymentMode(paymentMode);

        // Validacion: BASE mode requiere un monto base positivo
        if (paymentMode == Order.PaymentMode.BASE) {
            if (request.getBaseAmount() == null || request.getBaseAmount() <= 0) {
                throw new RuntimeException(
                    "El campo baseAmount es obligatorio y debe ser mayor a 0 cuando paymentMode es BASE");
            }
        }
        order.setBaseAmount(request.getBaseAmount());
        order.setStatus(Order.OrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        log.info("Pedido creado: {} para empresa: {} | Distancia: {}km | Precio estimado: ${}",
                orderId, companyId, distanceKm, estimatedPrice);

        return saved;
    }

    /**
     * Un domiciliario toma un pedido disponible.
     * Recalcula el precio con el tipo de vehiculo real del domiciliario.
     */
    public Order assignCourier(String orderId, String courierUserId,
                                 String courierId, String vehicleType) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + orderId));

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("El pedido no esta disponible. Estado actual: " + order.getStatus());
        }

        // Recalcular precio con el vehiculo real del domiciliario
        double finalPrice = pricingService.calculatePrice(
                order.getDistanceKm(), vehicleType, order.getPackageSize());

        order.setCourierId(courierId);
        order.setCourierUserId(courierUserId);
        order.setVehicleTypeUsed(vehicleType);
        order.setFinalPrice(finalPrice);
        order.setStatus(Order.OrderStatus.ASSIGNED);
        order.setAssignedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        Order updated = orderRepository.save(order);
        log.info("Pedido {} asignado al domiciliario {} (vehiculo: {}) | Precio final: ${}",
                orderId, courierId, vehicleType, finalPrice);

        return updated;
    }

    /**
     * El domiciliario confirma que recogió el paquete.
     */
    public Order markAsInTransit(String orderId, String courierUserId) {
        Order order = getOrderAndValidateCourier(orderId, courierUserId);

        if (order.getStatus() != Order.OrderStatus.ASSIGNED) {
            throw new RuntimeException("El pedido debe estar en estado ASSIGNED para marcar como IN_TRANSIT");
        }

        order.setStatus(Order.OrderStatus.IN_TRANSIT);
        order.setPickedUpAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        Order updated = orderRepository.save(order);
        log.info("Pedido {} marcado como IN_TRANSIT por domiciliario {}", orderId, courierUserId);
        return updated;
    }

    /**
     * El domiciliario confirma que entrego el paquete.
     */
    public Order markAsDelivered(String orderId, String courierUserId) {
        Order order = getOrderAndValidateCourier(orderId, courierUserId);

        if (order.getStatus() != Order.OrderStatus.IN_TRANSIT) {
            throw new RuntimeException("El pedido debe estar en estado IN_TRANSIT para marcar como entregado");
        }

        order.setStatus(Order.OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        Order updated = orderRepository.save(order);
        log.info("Pedido {} ENTREGADO por domiciliario {}", orderId, courierUserId);

        return updated;
    }

    /**
     * Cancela un pedido (empresa puede cancelar si esta PENDING, ADMIN puede cancelar siempre).
     */
    public Order cancelOrder(String orderId, String userId, String role, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + orderId));

        // Verificar permisos
        if ("COMPANY".equals(role)) {
            if (!order.getCompanyUserId().equals(userId)) {
                throw new RuntimeException("No tienes permiso para cancelar este pedido");
            }
            if (order.getStatus() != Order.OrderStatus.PENDING) {
                throw new RuntimeException("Solo puedes cancelar pedidos en estado PENDING");
            }
        } else if (!"ADMIN".equals(role)) {
            throw new RuntimeException("No tienes permiso para cancelar pedidos");
        }

        if (order.getStatus() == Order.OrderStatus.DELIVERED ||
                order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("No se puede cancelar un pedido en estado: " + order.getStatus());
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setCancellationReason(reason);
        order.setUpdatedAt(LocalDateTime.now());

        Order updated = orderRepository.save(order);
        log.info("Pedido {} CANCELADO. Motivo: {}", orderId, reason);
        return updated;
    }

    /**
     * La empresa califica al domiciliario despues de la entrega.
     */
    public Order rateDelivery(String orderId, String companyUserId,
                               int rating, String comment) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + orderId));

        if (!order.getCompanyUserId().equals(companyUserId)) {
            throw new RuntimeException("Solo la empresa del pedido puede calificar la entrega");
        }

        if (order.getStatus() != Order.OrderStatus.DELIVERED) {
            throw new RuntimeException("Solo se pueden calificar pedidos entregados");
        }

        if (order.getCourierRating() != null) {
            throw new RuntimeException("Este pedido ya fue calificado");
        }

        if (rating < 1 || rating > 5) {
            throw new RuntimeException("La calificacion debe ser entre 1 y 5");
        }

        order.setCourierRating(rating);
        order.setRatingComment(comment);
        order.setUpdatedAt(LocalDateTime.now());

        Order updated = orderRepository.save(order);
        log.info("Pedido {} calificado con {} estrellas", orderId, rating);

        return updated;
    }

    // Consultas

    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + orderId));
    }

    public List<Order> getOrdersByCompany(String companyId) {
        return orderRepository.findByCompanyId(companyId);
    }

    public List<Order> getOrdersByCourier(String courierId) {
        return orderRepository.findByCourierId(courierId);
    }

    public List<Order> getPendingOrders() {
        return orderRepository.findByStatus(Order.OrderStatus.PENDING);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    /**
     * Estimacion de precio antes de crear el pedido.
     */
    public PricingService.PriceEstimate estimatePrice(
            double pickupLat, double pickupLon,
            double deliveryLat, double deliveryLon,
            Order.PackageSize packageSize) {

        double distanceKm = haversineService.calculateDistance(pickupLat, pickupLon, deliveryLat, deliveryLon);
        return pricingService.estimatePrice(distanceKm, packageSize);
    }

    private Order getOrderAndValidateCourier(String orderId, String courierUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + orderId));

        if (!courierUserId.equals(order.getCourierUserId())) {
            throw new RuntimeException("No eres el domiciliario asignado a este pedido");
        }

        return order;
    }
}

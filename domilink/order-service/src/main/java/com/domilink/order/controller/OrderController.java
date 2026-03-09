package com.domilink.order.controller;

import com.domilink.order.dto.CreateOrderRequest;
import com.domilink.order.model.Order;
import com.domilink.order.service.OrderService;
import com.domilink.order.service.PricingService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST del Order Service.
 *
 * Endpoints:
 * POST   /api/orders                        - Crear pedido (rol: COMPANY)
 * GET    /api/orders                        - Pedidos disponibles/propios segun rol
 * GET    /api/orders/{id}                   - Detalle pedido (autenticado)
 * POST   /api/orders/{id}/assign            - Domiciliario toma el pedido (rol: COURIER)
 * PUT    /api/orders/{id}/in-transit        - Marcar en camino (rol: COURIER)
 * PUT    /api/orders/{id}/delivered         - Marcar como entregado (rol: COURIER)
 * PUT    /api/orders/{id}/cancel            - Cancelar pedido (rol: COMPANY, ADMIN)
 * POST   /api/orders/{id}/rate              - Calificar entrega (rol: COMPANY)
 * GET    /api/orders/estimate               - Estimacion de precio (autenticado)
 * GET    /api/orders/pending                - Pedidos pendientes para domiciliarios (rol: COURIER)
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Crear un nuevo pedido. Solo empresas activas.
     * El header X-Company-Id debe enviarse con el ID de la empresa.
     */
    @PostMapping
    public ResponseEntity<Order> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader(value = "X-Company-Id", required = false) String companyId) {

        if (!"COMPANY".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Order order = orderService.createOrder(userId, companyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    /**
     * Lista pedidos segun el rol:
     * - COMPANY: sus propios pedidos (por companyId si disponible, sino por userId)
     * - COURIER: sus pedidos asignados (por courierId si disponible, sino por userId)
     * - ADMIN: todos los pedidos
     *
     * Nota: X-Company-Id y X-Courier-Id son opcionales y se setean despues del login.
     * Si no estan disponibles, se usa el userId como fallback.
     */
    @GetMapping
    public ResponseEntity<List<Order>> getOrders(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader(value = "X-Company-Id", required = false) String companyId,
            @RequestHeader(value = "X-Courier-Id", required = false) String courierId) {

        List<Order> orders;

        switch (role) {
            case "COMPANY" -> {
                if (companyId != null && !companyId.isBlank()) {
                    orders = orderService.getOrdersByCompany(companyId);
                } else {
                    // Fallback: buscar por userId de empresa
                    orders = orderService.getOrdersByCompanyUserId(userId);
                }
            }
            case "COURIER" -> {
                if (courierId != null && !courierId.isBlank()) {
                    orders = orderService.getOrdersByCourier(courierId);
                } else {
                    // Fallback: buscar por userId del domiciliario
                    orders = orderService.getOrdersByCourierUserId(userId);
                }
            }
            case "ADMIN" -> orders = orderService.getAllOrders();
            default -> {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        return ResponseEntity.ok(orders);
    }

    /**
     * Pedidos en estado PENDING visibles para domiciliarios.
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Order>> getPendingOrders(
            @RequestHeader("X-User-Role") String role) {

        if (!"COURIER".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(orderService.getPendingOrders());
    }

    /**
     * Estima el precio de un pedido antes de crearlo.
     */
    @GetMapping("/estimate")
    public ResponseEntity<PricingService.PriceEstimate> estimatePrice(
            @RequestParam double pickupLat,
            @RequestParam double pickupLon,
            @RequestParam double deliveryLat,
            @RequestParam double deliveryLon,
            @RequestParam(defaultValue = "SMALL") Order.PackageSize packageSize) {

        PricingService.PriceEstimate estimate = orderService.estimatePrice(
                pickupLat, pickupLon, deliveryLat, deliveryLon, packageSize);

        return ResponseEntity.ok(estimate);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable String id) {
        Order order = orderService.getOrderById(id);
        return ResponseEntity.ok(order);
    }

    /**
     * Un domiciliario toma un pedido disponible.
     * El body debe incluir courierId y vehicleType.
     */
    @PostMapping("/{id}/assign")
    public ResponseEntity<Order> assignOrder(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COURIER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String courierId = body.get("courierId");
        String vehicleType = body.get("vehicleType");

        if (courierId == null || vehicleType == null) {
            return ResponseEntity.badRequest().body(null);
        }

        Order updated = orderService.assignCourier(id, userId, courierId, vehicleType);
        return ResponseEntity.ok(updated);
    }

    /**
     * Domiciliario marca el pedido como recogido (IN_TRANSIT).
     */
    @PutMapping("/{id}/in-transit")
    public ResponseEntity<Order> markInTransit(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COURIER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Order updated = orderService.markAsInTransit(id, userId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Domiciliario marca el pedido como entregado.
     */
    @PutMapping("/{id}/delivered")
    public ResponseEntity<Order> markDelivered(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COURIER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Order updated = orderService.markAsDelivered(id, userId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Cancela un pedido.
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        String reason = body.getOrDefault("reason", "Sin motivo especificado");
        Order updated = orderService.cancelOrder(id, userId, role, reason);
        return ResponseEntity.ok(updated);
    }

    /**
     * Empresa califica la entrega del domiciliario.
     */
    @PostMapping("/{id}/rate")
    public ResponseEntity<Order> rateDelivery(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COMPANY".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Object ratingObj = body.get("rating");
        if (ratingObj == null) {
            return ResponseEntity.badRequest().body(null);
        }
        int rating;
        try {
            rating = ((Number) ratingObj).intValue();
        } catch (ClassCastException e) {
            return ResponseEntity.badRequest().body(null);
        }
        String comment = (String) body.getOrDefault("comment", "");

        Order updated = orderService.rateDelivery(id, userId, rating, comment);
        return ResponseEntity.ok(updated);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleException(RuntimeException e) {
        log.warn("Error en OrderController: {}", e.getMessage());
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

package com.domilink.courier.controller;

import com.domilink.courier.dto.CreateCourierRequest;
import com.domilink.courier.dto.UpdateLocationRequest;
import com.domilink.courier.model.Courier;
import com.domilink.courier.service.CourierService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST del Courier Service.
 *
 * Endpoints:
 * POST  /api/couriers              - Crear perfil domiciliario (rol: COURIER)
 * GET   /api/couriers/me           - Mi perfil (rol: COURIER)
 * GET   /api/couriers/available    - Domiciliarios disponibles (rol: COMPANY, ADMIN)
 * GET   /api/couriers/{id}         - Detalle domiciliario (autenticado)
 * PUT   /api/couriers/location     - Actualizar ubicacion en tiempo real (rol: COURIER)
 * PUT   /api/couriers/documents    - Subir URLs de documentos (rol: COURIER)
 * GET   /api/couriers/admin/all    - Todos los domiciliarios (rol: ADMIN)
 * PUT   /api/couriers/{id}/status  - Cambiar estado (rol: ADMIN)
 */
@RestController
@RequestMapping("/api/couriers")
public class CourierController {

    private static final Logger log = LoggerFactory.getLogger(CourierController.class);

    private final CourierService courierService;

    public CourierController(CourierService courierService) {
        this.courierService = courierService;
    }

    @PostMapping
    public ResponseEntity<Courier> createCourier(
            @Valid @RequestBody CreateCourierRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COURIER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Courier courier = courierService.createCourier(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(courier);
    }

    @GetMapping("/me")
    public ResponseEntity<Courier> getMyCourier(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COURIER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Courier courier = courierService.getMyCourier(userId);
        return ResponseEntity.ok(courier);
    }

    @GetMapping("/available")
    public ResponseEntity<List<Courier>> getAvailableCouriers(
            @RequestHeader("X-User-Role") String role) {

        // Solo empresas y admins pueden ver la lista de disponibles
        if (!"COMPANY".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(courierService.getAvailableCouriers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Courier> getCourierById(@PathVariable String id) {
        Courier courier = courierService.getCourierById(id);
        return ResponseEntity.ok(courier);
    }

    /**
     * Actualiza ubicacion en tiempo real. Llamado frecuentemente por la app.
     */
    @PutMapping("/location")
    public ResponseEntity<Courier> updateLocation(
            @RequestBody UpdateLocationRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COURIER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Courier updated = courierService.updateLocation(userId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Registra URLs de documentos de verificacion.
     * Los archivos deben subirse primero a Cloud Storage.
     */
    @PutMapping("/documents")
    public ResponseEntity<Courier> uploadDocuments(
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COURIER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Courier updated = courierService.uploadDocuments(
                userId,
                body.get("documentPhotoUrl"),
                body.get("selfieUrl"),
                body.get("certificateUrl")
        );
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<Courier>> getAllCouriers(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) String status) {

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (status != null) {
            try {
                Courier.CourierStatus courierStatus = Courier.CourierStatus.valueOf(status);
                return ResponseEntity.ok(courierService.getCouriersByStatus(courierStatus));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }

        return ResponseEntity.ok(courierService.getAllCouriers());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Courier> updateCourierStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Role") String role) {

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Courier.CourierStatus newStatus;
        try {
            newStatus = Courier.CourierStatus.valueOf(body.get("status"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        Courier updated = courierService.updateCourierStatus(
                id, newStatus, body.get("rejectionReason"), role);
        return ResponseEntity.ok(updated);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleException(RuntimeException e) {
        log.warn("Error en CourierController: {}", e.getMessage());
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

package com.domilink.courier.service;

import com.domilink.courier.dto.CreateCourierRequest;
import com.domilink.courier.dto.UpdateLocationRequest;
import com.domilink.courier.model.Courier;
import com.domilink.courier.repository.CourierRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CourierService {

    private static final Logger log = LoggerFactory.getLogger(CourierService.class);

    private final CourierRepository courierRepository;

    public CourierService(CourierRepository courierRepository) {
        this.courierRepository = courierRepository;
    }

    /**
     * Registra el perfil de domiciliario para un usuario autenticado con rol COURIER.
     */
    public Courier createCourier(String userId, CreateCourierRequest request) {
        // Un usuario solo puede tener un perfil de domiciliario
        courierRepository.findByUserId(userId).ifPresent(existing -> {
            throw new RuntimeException("El usuario ya tiene un perfil de domiciliario: " + existing.getId());
        });

        // Documento unico
        if (courierRepository.existsByDocumentNumber(request.getDocumentNumber())) {
            throw new RuntimeException("El numero de documento ya esta registrado: " + request.getDocumentNumber());
        }

        String courierId = UUID.randomUUID().toString();
        Courier courier = new Courier(courierId, userId, request.getFirstName(),
                request.getLastName(), request.getDocumentNumber());
        courier.setPhone(request.getPhone());
        courier.setEmail(request.getEmail());
        courier.setVehicleType(request.getVehicleType());
        courier.setVehiclePlate(request.getVehiclePlate());
        courier.setVehicleModel(request.getVehicleModel());

        Courier saved = courierRepository.save(courier);
        log.info("Domiciliario creado: {} {} (doc: {}) para usuario: {}",
                saved.getFirstName(), saved.getLastName(), saved.getDocumentNumber(), userId);
        return saved;
    }

    /**
     * Retorna el perfil del domiciliario autenticado.
     */
    public Courier getMyCourier(String userId) {
        return courierRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No tienes perfil de domiciliario registrado"));
    }

    /**
     * Obtiene un domiciliario por ID.
     */
    public Courier getCourierById(String courierId) {
        return courierRepository.findById(courierId)
                .orElseThrow(() -> new RuntimeException("Domiciliario no encontrado: " + courierId));
    }

    /**
     * Lista domiciliarios disponibles (para el Order Service al asignar pedidos).
     */
    public List<Courier> getAvailableCouriers() {
        return courierRepository.findAvailable();
    }

    /**
     * Lista todos los domiciliarios (solo ADMIN).
     */
    public List<Courier> getAllCouriers() {
        return courierRepository.findAll();
    }

    /**
     * Lista domiciliarios por estado (solo ADMIN).
     */
    public List<Courier> getCouriersByStatus(Courier.CourierStatus status) {
        return courierRepository.findByStatus(status);
    }

    /**
     * Actualiza la ubicacion en tiempo real del domiciliario.
     * Este endpoint se llama frecuentemente desde la app movil.
     */
    public Courier updateLocation(String userId, UpdateLocationRequest request) {
        Courier courier = courierRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Perfil de domiciliario no encontrado"));

        if (courier.getStatus() != Courier.CourierStatus.ACTIVE) {
            throw new RuntimeException("Solo domiciliarios activos pueden actualizar ubicacion");
        }

        courier.setCurrentLatitude(request.getLatitude());
        courier.setCurrentLongitude(request.getLongitude());
        courier.setAvailable(request.isAvailable());
        courier.setUpdatedAt(LocalDateTime.now());

        return courierRepository.save(courier);
    }

    /**
     * Sube las URLs de los documentos de verificacion.
     * En produccion, los archivos se suben primero a Cloud Storage y se guarda la URL.
     */
    public Courier uploadDocuments(String userId, String documentPhotoUrl,
                                    String selfieUrl, String certificateUrl) {
        Courier courier = courierRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Perfil de domiciliario no encontrado"));

        courier.setDocumentPhotoUrl(documentPhotoUrl);
        courier.setSelfieUrl(selfieUrl);
        courier.setCertificateUrl(certificateUrl);
        courier.setUpdatedAt(LocalDateTime.now());

        log.info("Documentos subidos para domiciliario: {}", courier.getId());
        return courierRepository.save(courier);
    }

    /**
     * Aprueba o rechaza un domiciliario (solo ADMIN).
     */
    public Courier updateCourierStatus(String courierId, Courier.CourierStatus newStatus,
                                        String rejectionReason, String adminRole) {
        if (!"ADMIN".equals(adminRole)) {
            throw new RuntimeException("Solo los administradores pueden cambiar el estado");
        }

        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() -> new RuntimeException("Domiciliario no encontrado: " + courierId));

        courier.setStatus(newStatus);
        courier.setRejectionReason(rejectionReason);
        courier.setUpdatedAt(LocalDateTime.now());

        Courier updated = courierRepository.save(courier);
        log.info("Estado de domiciliario {} actualizado a: {}", courierId, newStatus);
        return updated;
    }

    /**
     * Actualiza la calificacion del domiciliario despues de una entrega.
     * Llamado internamente por el Order Service.
     */
    public Courier updateRating(String courierId, double newRating) {
        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() -> new RuntimeException("Domiciliario no encontrado: " + courierId));

        // Promedio ponderado simple
        int deliveries = courier.getTotalDeliveries();
        double currentRating = courier.getRating();
        double updatedRating = ((currentRating * deliveries) + newRating) / (deliveries + 1);

        courier.setRating(Math.round(updatedRating * 10.0) / 10.0);
        courier.setTotalDeliveries(deliveries + 1);
        courier.setUpdatedAt(LocalDateTime.now());

        return courierRepository.save(courier);
    }
}

package com.domilink.courier.service;

import com.domilink.courier.dto.CreateCourierRequest;
import com.domilink.courier.dto.UpdateLocationRequest;
import com.domilink.courier.model.Courier;
import com.domilink.courier.repository.CourierRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CourierService {

    private static final Logger log = LoggerFactory.getLogger(CourierService.class);

    /**
     * Porcentaje de comision diaria de la plataforma sobre las ganancias del dia.
     * Ejemplo: 10% → si gano 50.000 COP, debo 5.000 COP al finalizar el dia.
     */
    private static final double DAILY_COMMISSION_RATE = 0.10;

    /**
     * Maximo de entradas en el historial del wallet.
     */
    private static final int WALLET_HISTORY_MAX = 50;

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
     * Tambien verifica y resetea la deuda diaria si es un dia nuevo.
     */
    public Courier getMyCourier(String userId) {
        Courier courier = courierRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No tienes perfil de domiciliario registrado"));
        checkAndResetDailyDebt(courier);
        return courier;
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
     * Tambien acumula la comision diaria sobre el precio de la entrega.
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

    // ── WALLET ────────────────────────────────────────────────────────────────

    /**
     * Registra una entrega completada: acumula comision diaria en el wallet.
     * Llamado cuando el domiciliario marca un pedido como DELIVERED.
     *
     * @param courierId   ID del domiciliario
     * @param orderAmount Precio final del pedido entregado (finalPrice)
     * @param orderId     ID del pedido para el historial
     */
    public Courier recordDeliveryEarning(String courierId, double orderAmount, String orderId) {
        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() -> new RuntimeException("Domiciliario no encontrado: " + courierId));

        checkAndResetDailyDebt(courier);

        double commission = Math.round(orderAmount * DAILY_COMMISSION_RATE / 100.0) * 100.0;
        courier.setDailyDebt(courier.getDailyDebt() + commission);

        // Agregar al historial
        addWalletTransaction(courier, "DEBIT", commission,
                "Comision pedido #" + orderId.substring(0, 8));

        courier.setUpdatedAt(LocalDateTime.now());
        log.info("Comision ${} cargada al domiciliario {} por pedido {}", commission, courierId, orderId);
        return courierRepository.save(courier);
    }

    /**
     * El domiciliario paga la deuda diaria (se descuenta del pago en efectivo o transferencia).
     *
     * @param userId ID del usuario (del JWT)
     * @param amount Monto pagado en COP
     */
    public Courier payDailyDebt(String userId, double amount) {
        Courier courier = courierRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Perfil de domiciliario no encontrado"));

        checkAndResetDailyDebt(courier);

        if (amount <= 0) {
            throw new RuntimeException("El monto a pagar debe ser mayor a 0");
        }

        double currentDebt = courier.getDailyDebt();
        if (amount > currentDebt + 1) { // +1 para tolerancia de centavos
            throw new RuntimeException("El monto supera la deuda actual de $" + currentDebt);
        }

        double newDebt = Math.max(0, currentDebt - amount);
        courier.setDailyDebt(newDebt);

        // Si la deuda queda en 0 o menos, desbloquear
        if (newDebt <= 0) {
            courier.setBlockedByDebt(false);
        }

        addWalletTransaction(courier, "PAYMENT", amount, "Pago de deuda diaria");

        courier.setUpdatedAt(LocalDateTime.now());
        log.info("Domiciliario {} pagó ${} de deuda. Deuda restante: ${}", courier.getId(), amount, newDebt);
        return courierRepository.save(courier);
    }

    /**
     * Retorna el estado del wallet del domiciliario.
     */
    public Courier getWallet(String userId) {
        Courier courier = courierRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Perfil de domiciliario no encontrado"));
        checkAndResetDailyDebt(courier);
        return courier;
    }

    // ── TRACKING ──────────────────────────────────────────────────────────────

    /**
     * Retorna la ubicacion actual de un domiciliario (para que la empresa haga tracking).
     * Solo retorna si el domiciliario tiene un pedido activo.
     *
     * @param courierId ID del domiciliario
     * @return Map con lat, lng, updatedAt
     */
    public java.util.Map<String, Object> getCourierLocation(String courierId) {
        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() -> new RuntimeException("Domiciliario no encontrado: " + courierId));

        java.util.Map<String, Object> location = new java.util.HashMap<>();
        location.put("courierId", courier.getId());
        location.put("latitude", courier.getCurrentLatitude());
        location.put("longitude", courier.getCurrentLongitude());
        location.put("available", courier.isAvailable());
        location.put("updatedAt", courier.getUpdatedAt() != null
                ? courier.getUpdatedAt().toString() : null);
        location.put("name", courier.getFirstName() + " " + courier.getLastName());
        location.put("vehicleType", courier.getVehicleType() != null
                ? courier.getVehicleType().name() : null);
        return location;
    }

    // ── PRIVADOS ──────────────────────────────────────────────────────────────

    /**
     * Verifica si es un dia nuevo. Si la deuda del dia anterior no fue pagada,
     * bloquea al domiciliario. Si es un dia nuevo y la deuda fue pagada, resetea.
     */
    private void checkAndResetDailyDebt(Courier courier) {
        String today = LocalDate.now().toString();
        String lastReset = courier.getLastDebtResetDate();

        if (lastReset == null || !lastReset.equals(today)) {
            // Es un dia nuevo
            if (courier.getDailyDebt() > 0) {
                // Hay deuda del dia anterior → bloquear
                courier.setBlockedByDebt(true);
                log.warn("Domiciliario {} bloqueado por deuda impaga de ${}", 
                        courier.getId(), courier.getDailyDebt());
            } else {
                // Sin deuda → solo actualizar fecha
                courier.setBlockedByDebt(false);
            }
            courier.setLastDebtResetDate(today);
            courierRepository.save(courier);
        }
    }

    /**
     * Agrega una transaccion al historial del wallet (max WALLET_HISTORY_MAX entradas).
     */
    private void addWalletTransaction(Courier courier, String type, double amount, String description) {
        List<Courier.WalletTransaction> history = courier.getWalletHistory();
        if (history == null) {
            history = new ArrayList<>();
            courier.setWalletHistory(history);
        }

        Courier.WalletTransaction tx = new Courier.WalletTransaction(
                UUID.randomUUID().toString(),
                type,
                amount,
                description,
                LocalDateTime.now()
        );
        history.add(0, tx); // Mas reciente primero

        // Limitar historial
        if (history.size() > WALLET_HISTORY_MAX) {
            courier.setWalletHistory(history.subList(0, WALLET_HISTORY_MAX));
        }
    }
}

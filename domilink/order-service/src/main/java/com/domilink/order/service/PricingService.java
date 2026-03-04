package com.domilink.order.service;

import com.domilink.order.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Servicio de calculo de precios de domicilio.
 *
 * Formula:
 * precio = max(MIN, min(MAX, (basePrice + distancia * precioPorKm) * multiplicadorVehiculo * multiplicadorPaquete))
 *
 * Esta logica estara en un Pricing Service separado en Fase 2.
 * Por ahora se mantiene aqui para simplicidad de la Fase 1.
 */
@Service
public class PricingService {

    private static final Logger log = LoggerFactory.getLogger(PricingService.class);

    @Value("${pricing.base-price:3000.0}")
    private double basePrice;

    @Value("${pricing.price-per-km:1500.0}")
    private double pricePerKm;

    @Value("${pricing.minimum-price:5000.0}")
    private double minimumPrice;

    @Value("${pricing.maximum-price:80000.0}")
    private double maximumPrice;

    // Multiplicadores por tipo de vehiculo
    private static final Map<String, Double> VEHICLE_MULTIPLIERS = Map.of(
            "MOTORCYCLE", 1.0,
            "BICYCLE", 0.8,
            "WALKING", 0.6,
            "CAR", 1.4
    );

    // Multiplicadores por tamano de paquete
    private static final Map<Order.PackageSize, Double> SIZE_MULTIPLIERS = Map.of(
            Order.PackageSize.SMALL, 1.0,
            Order.PackageSize.MEDIUM, 1.1,
            Order.PackageSize.LARGE, 1.3,
            Order.PackageSize.EXTRA_LARGE, 1.6
    );

    /**
     * Calcula el precio del domicilio.
     *
     * @param distanceKm     Distancia calculada con Haversine
     * @param vehicleType    Tipo de vehiculo del domiciliario
     * @param packageSize    Tamano del paquete
     * @return Precio final en COP (pesos colombianos)
     */
    public double calculatePrice(double distanceKm, String vehicleType, Order.PackageSize packageSize) {
        double vehicleMultiplier = VEHICLE_MULTIPLIERS.getOrDefault(vehicleType, 1.0);
        double sizeMultiplier = SIZE_MULTIPLIERS.getOrDefault(packageSize, 1.0);

        double rawPrice = (basePrice + (distanceKm * pricePerKm)) * vehicleMultiplier * sizeMultiplier;

        // Aplicar limites
        double finalPrice = Math.max(minimumPrice, Math.min(maximumPrice, rawPrice));

        // Redondear a los 100 pesos mas cercanos (practica comun en Colombia)
        finalPrice = Math.round(finalPrice / 100.0) * 100.0;

        log.debug("Calculo de precio: {}km x ${}/km, vehiculo={} ({}x), paquete={} ({}x) = ${}",
                distanceKm, pricePerKm, vehicleType, vehicleMultiplier,
                packageSize, sizeMultiplier, finalPrice);

        return finalPrice;
    }

    /**
     * Estima el precio antes de crear el pedido.
     * Util para mostrar al usuario el precio aproximado.
     */
    public PriceEstimate estimatePrice(double distanceKm, Order.PackageSize packageSize) {
        // Calcular precio para cada tipo de vehiculo
        double motorcyclePrice = calculatePrice(distanceKm, "MOTORCYCLE", packageSize);
        double bicyclePrice = calculatePrice(distanceKm, "BICYCLE", packageSize);
        double carPrice = calculatePrice(distanceKm, "CAR", packageSize);

        return new PriceEstimate(distanceKm, motorcyclePrice, bicyclePrice, carPrice);
    }

    public double getBasePrice() { return basePrice; }
    public double getPricePerKm() { return pricePerKm; }

    /**
     * DTO de estimacion de precio.
     */
    public static class PriceEstimate {
        private final double distanceKm;
        private final double motorcyclePrice;
        private final double bicyclePrice;
        private final double carPrice;

        public PriceEstimate(double distanceKm, double motorcyclePrice,
                              double bicyclePrice, double carPrice) {
            this.distanceKm = distanceKm;
            this.motorcyclePrice = motorcyclePrice;
            this.bicyclePrice = bicyclePrice;
            this.carPrice = carPrice;
        }

        public double getDistanceKm() { return distanceKm; }
        public double getMotorcyclePrice() { return motorcyclePrice; }
        public double getBicyclePrice() { return bicyclePrice; }
        public double getCarPrice() { return carPrice; }
    }
}

package com.domilink.courier.repository;

import com.domilink.courier.model.Courier;

import java.util.List;
import java.util.Optional;

public interface CourierRepository {

    Courier save(Courier courier);

    Optional<Courier> findById(String id);

    Optional<Courier> findByUserId(String userId);

    Optional<Courier> findByDocumentNumber(String documentNumber);

    List<Courier> findAll();

    List<Courier> findByStatus(Courier.CourierStatus status);

    List<Courier> findAvailable();

    void deleteById(String id);

    boolean existsByDocumentNumber(String documentNumber);
}

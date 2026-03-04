package com.domilink.courier.repository;

import com.domilink.courier.model.Courier;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryCourierRepository implements CourierRepository {

    private final Map<String, Courier> store = new ConcurrentHashMap<>();

    @Override
    public Courier save(Courier courier) {
        store.put(courier.getId(), courier);
        return courier;
    }

    @Override
    public Optional<Courier> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Optional<Courier> findByUserId(String userId) {
        return store.values().stream()
                .filter(c -> userId.equals(c.getUserId()))
                .findFirst();
    }

    @Override
    public Optional<Courier> findByDocumentNumber(String documentNumber) {
        return store.values().stream()
                .filter(c -> documentNumber.equals(c.getDocumentNumber()))
                .findFirst();
    }

    @Override
    public List<Courier> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public List<Courier> findByStatus(Courier.CourierStatus status) {
        return store.values().stream()
                .filter(c -> status.equals(c.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Courier> findAvailable() {
        return store.values().stream()
                .filter(c -> c.isAvailable() && Courier.CourierStatus.ACTIVE.equals(c.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(String id) {
        store.remove(id);
    }

    @Override
    public boolean existsByDocumentNumber(String documentNumber) {
        return store.values().stream().anyMatch(c -> documentNumber.equals(c.getDocumentNumber()));
    }
}

package com.domilink.order.repository;

import com.domilink.order.model.Order;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryOrderRepository implements OrderRepository {

    private final Map<String, Order> store = new ConcurrentHashMap<>();

    @Override
    public Order save(Order order) {
        store.put(order.getId(), order);
        return order;
    }

    @Override
    public Optional<Order> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<Order> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public List<Order> findByCompanyId(String companyId) {
        return store.values().stream()
                .filter(o -> companyId.equals(o.getCompanyId()))
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByCourierId(String courierId) {
        return store.values().stream()
                .filter(o -> courierId.equals(o.getCourierId()))
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByStatus(Order.OrderStatus status) {
        return store.values().stream()
                .filter(o -> status.equals(o.getStatus()))
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByCompanyIdAndStatus(String companyId, Order.OrderStatus status) {
        return store.values().stream()
                .filter(o -> companyId.equals(o.getCompanyId()) && status.equals(o.getStatus()))
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByCompanyUserId(String companyUserId) {
        return store.values().stream()
                .filter(o -> companyUserId.equals(o.getCompanyUserId()))
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByCourierUserId(String courierUserId) {
        return store.values().stream()
                .filter(o -> courierUserId.equals(o.getCourierUserId()))
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(String id) {
        store.remove(id);
    }
}

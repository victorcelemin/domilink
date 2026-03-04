package com.domilink.order.repository;

import com.domilink.order.model.Order;

import java.util.List;
import java.util.Optional;

public interface OrderRepository {

    Order save(Order order);

    Optional<Order> findById(String id);

    List<Order> findAll();

    List<Order> findByCompanyId(String companyId);

    List<Order> findByCourierId(String courierId);

    List<Order> findByStatus(Order.OrderStatus status);

    List<Order> findByCompanyIdAndStatus(String companyId, Order.OrderStatus status);

    void deleteById(String id);
}

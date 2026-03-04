package com.domilink.company.repository;

import com.domilink.company.model.Company;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Implementacion en memoria del repositorio de empresas.
 * Usada en desarrollo local. En produccion, reemplazar con FirestoreCompanyRepository.
 *
 * Para cambiar a Firestore:
 * 1. Crear FirestoreCompanyRepository implementando CompanyRepository
 * 2. Anotar esta clase con @Profile("local")
 * 3. Anotar la implementacion Firestore con @Profile("!local")
 */
@Repository
public class InMemoryCompanyRepository implements CompanyRepository {

    private final Map<String, Company> store = new ConcurrentHashMap<>();

    @Override
    public Company save(Company company) {
        store.put(company.getId(), company);
        return company;
    }

    @Override
    public Optional<Company> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Optional<Company> findByUserId(String userId) {
        return store.values().stream()
                .filter(c -> userId.equals(c.getUserId()))
                .findFirst();
    }

    @Override
    public Optional<Company> findByNit(String nit) {
        return store.values().stream()
                .filter(c -> nit.equals(c.getNit()))
                .findFirst();
    }

    @Override
    public List<Company> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public List<Company> findByStatus(Company.CompanyStatus status) {
        return store.values().stream()
                .filter(c -> status.equals(c.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(String id) {
        store.remove(id);
    }

    @Override
    public boolean existsByNit(String nit) {
        return store.values().stream().anyMatch(c -> nit.equals(c.getNit()));
    }
}

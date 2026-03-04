package com.domilink.company.repository;

import com.domilink.company.model.Company;

import java.util.List;
import java.util.Optional;

/**
 * Interfaz del repositorio de empresas.
 * Permite intercambiar la implementacion entre:
 * - InMemoryCompanyRepository (desarrollo local)
 * - FirestoreCompanyRepository (produccion en GCP)
 */
public interface CompanyRepository {

    Company save(Company company);

    Optional<Company> findById(String id);

    Optional<Company> findByUserId(String userId);

    Optional<Company> findByNit(String nit);

    List<Company> findAll();

    List<Company> findByStatus(Company.CompanyStatus status);

    void deleteById(String id);

    boolean existsByNit(String nit);
}

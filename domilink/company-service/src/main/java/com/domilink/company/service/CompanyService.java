package com.domilink.company.service;

import com.domilink.company.dto.CreateCompanyRequest;
import com.domilink.company.model.Company;
import com.domilink.company.repository.CompanyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Logica de negocio para la gestion de empresas.
 */
@Service
public class CompanyService {

    private static final Logger log = LoggerFactory.getLogger(CompanyService.class);

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    /**
     * Registra el perfil de empresa para un usuario autenticado con rol COMPANY.
     */
    public Company createCompany(String userId, CreateCompanyRequest request) {
        // Un usuario solo puede tener una empresa
        companyRepository.findByUserId(userId).ifPresent(existing -> {
            throw new RuntimeException("El usuario ya tiene una empresa registrada con ID: " + existing.getId());
        });

        // NIT unico en la plataforma
        if (companyRepository.existsByNit(request.getNit())) {
            throw new RuntimeException("El NIT ya esta registrado: " + request.getNit());
        }

        String companyId = UUID.randomUUID().toString();
        Company company = new Company(companyId, userId, request.getName(), request.getNit(), request.getEmail());
        company.setPhone(request.getPhone());
        company.setAddress(request.getAddress());
        company.setCity(request.getCity());
        company.setLatitude(request.getLatitude());
        company.setLongitude(request.getLongitude());
        company.setDescription(request.getDescription());
        // En dev se activa directamente; en produccion cambiar a PENDING para revision manual
        company.setStatus(Company.CompanyStatus.ACTIVE);

        Company saved = companyRepository.save(company);
        log.info("Empresa creada: {} (NIT: {}) para usuario: {}", saved.getName(), saved.getNit(), userId);
        return saved;
    }

    /**
     * Obtiene la empresa del usuario autenticado.
     */
    public Company getMyCompany(String userId) {
        return companyRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No tienes empresa registrada"));
    }

    /**
     * Obtiene una empresa por ID (visible para todos los autenticados).
     */
    public Company getCompanyById(String companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada: " + companyId));
    }

    /**
     * Retorna todas las empresas activas (para domiciliarios buscando trabajo).
     */
    public List<Company> getActiveCompanies() {
        return companyRepository.findByStatus(Company.CompanyStatus.ACTIVE);
    }

    /**
     * Retorna todas las empresas (solo ADMIN).
     */
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    /**
     * Retorna empresas por estado (solo ADMIN).
     */
    public List<Company> getCompaniesByStatus(Company.CompanyStatus status) {
        return companyRepository.findByStatus(status);
    }

    /**
     * Actualiza el perfil de empresa (solo el dueno).
     */
    public Company updateCompany(String companyId, String userId, CreateCompanyRequest request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada: " + companyId));

        if (!company.getUserId().equals(userId)) {
            throw new RuntimeException("No tienes permiso para modificar esta empresa");
        }

        company.setName(request.getName());
        company.setPhone(request.getPhone());
        company.setAddress(request.getAddress());
        company.setCity(request.getCity());
        company.setLatitude(request.getLatitude());
        company.setLongitude(request.getLongitude());
        company.setDescription(request.getDescription());
        company.setUpdatedAt(LocalDateTime.now());

        Company updated = companyRepository.save(company);
        log.info("Empresa actualizada: {}", companyId);
        return updated;
    }

    /**
     * Aprueba o rechaza una empresa (solo ADMIN).
     */
    public Company updateCompanyStatus(String companyId, Company.CompanyStatus newStatus,
                                        String rejectionReason, String adminRole) {
        if (!"ADMIN".equals(adminRole)) {
            throw new RuntimeException("Solo los administradores pueden cambiar el estado de empresas");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada: " + companyId));

        company.setStatus(newStatus);
        company.setRejectionReason(rejectionReason);
        company.setUpdatedAt(LocalDateTime.now());

        Company updated = companyRepository.save(company);
        log.info("Estado de empresa {} actualizado a: {}", companyId, newStatus);
        return updated;
    }
}

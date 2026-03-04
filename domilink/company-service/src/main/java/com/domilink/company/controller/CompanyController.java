package com.domilink.company.controller;

import com.domilink.company.dto.CreateCompanyRequest;
import com.domilink.company.model.Company;
import com.domilink.company.service.CompanyService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST del Company Service.
 *
 * Endpoints:
 * POST   /api/companies           - Crear empresa (rol: COMPANY)
 * GET    /api/companies/me        - Mi empresa (rol: COMPANY)
 * GET    /api/companies           - Empresas activas (rol: COMPANY, COURIER)
 * GET    /api/companies/{id}      - Detalle empresa (autenticado)
 * PUT    /api/companies/{id}      - Actualizar empresa (dueno)
 * GET    /api/companies/admin/all - Todas las empresas (rol: ADMIN)
 * PUT    /api/companies/{id}/status - Cambiar estado (rol: ADMIN)
 */
@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private static final Logger log = LoggerFactory.getLogger(CompanyController.class);

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    /**
     * Registra la empresa del usuario autenticado.
     * Solo usuarios con rol COMPANY pueden hacerlo.
     */
    @PostMapping
    public ResponseEntity<Company> createCompany(
            @Valid @RequestBody CreateCompanyRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COMPANY".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Company company = companyService.createCompany(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(company);
    }

    /**
     * Retorna la empresa del usuario autenticado.
     */
    @GetMapping("/me")
    public ResponseEntity<Company> getMyCompany(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COMPANY".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Company company = companyService.getMyCompany(userId);
        return ResponseEntity.ok(company);
    }

    /**
     * Lista empresas activas (para domiciliarios buscando oportunidades).
     */
    @GetMapping
    public ResponseEntity<List<Company>> getActiveCompanies() {
        return ResponseEntity.ok(companyService.getActiveCompanies());
    }

    /**
     * Detalle de una empresa especifica.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Company> getCompanyById(@PathVariable String id) {
        Company company = companyService.getCompanyById(id);
        return ResponseEntity.ok(company);
    }

    /**
     * Actualiza el perfil de la empresa (solo el dueno).
     */
    @PutMapping("/{id}")
    public ResponseEntity<Company> updateCompany(
            @PathVariable String id,
            @Valid @RequestBody CreateCompanyRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        if (!"COMPANY".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Company updated = companyService.updateCompany(id, userId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Lista todas las empresas (solo ADMIN).
     */
    @GetMapping("/admin/all")
    public ResponseEntity<List<Company>> getAllCompanies(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) String status) {

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (status != null) {
            try {
                Company.CompanyStatus companyStatus = Company.CompanyStatus.valueOf(status);
                return ResponseEntity.ok(companyService.getCompaniesByStatus(companyStatus));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }

        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    /**
     * Cambia el estado de una empresa (solo ADMIN).
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Company> updateCompanyStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Role") String role) {

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String statusStr = body.get("status");
        String rejectionReason = body.get("rejectionReason");

        Company.CompanyStatus newStatus;
        try {
            newStatus = Company.CompanyStatus.valueOf(statusStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        Company updated = companyService.updateCompanyStatus(id, newStatus, rejectionReason, role);
        return ResponseEntity.ok(updated);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleException(RuntimeException e) {
        log.warn("Error en CompanyController: {}", e.getMessage());
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

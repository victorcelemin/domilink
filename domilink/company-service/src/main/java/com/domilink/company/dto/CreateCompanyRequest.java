package com.domilink.company.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CreateCompanyRequest {

    @NotBlank(message = "El nombre de la empresa es obligatorio")
    private String name;

    @NotBlank(message = "El NIT es obligatorio")
    @Pattern(regexp = "\\d{9,10}-?\\d?", message = "Formato de NIT invalido")
    private String nit;

    @NotBlank(message = "El email de la empresa es obligatorio")
    @Email(message = "Formato de email invalido")
    private String email;

    private String phone;

    @NotBlank(message = "La direccion es obligatoria")
    private String address;

    @NotBlank(message = "La ciudad es obligatoria")
    private String city;

    private double latitude;
    private double longitude;
    private String description;

    // Getters y Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNit() { return nit; }
    public void setNit(String nit) { this.nit = nit; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

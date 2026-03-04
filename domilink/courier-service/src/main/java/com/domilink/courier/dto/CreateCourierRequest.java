package com.domilink.courier.dto;

import com.domilink.courier.model.Courier;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CreateCourierRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    private String lastName;

    @NotBlank(message = "El numero de documento es obligatorio")
    @Pattern(regexp = "\\d{7,10}", message = "El documento debe tener entre 7 y 10 digitos")
    private String documentNumber;

    @NotBlank(message = "El telefono es obligatorio")
    private String phone;

    @NotBlank(message = "El email es obligatorio")
    private String email;

    @NotNull(message = "El tipo de vehiculo es obligatorio")
    private Courier.VehicleType vehicleType;

    private String vehiclePlate;
    private String vehicleModel;

    // Getters y Setters
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Courier.VehicleType getVehicleType() { return vehicleType; }
    public void setVehicleType(Courier.VehicleType vehicleType) { this.vehicleType = vehicleType; }

    public String getVehiclePlate() { return vehiclePlate; }
    public void setVehiclePlate(String vehiclePlate) { this.vehiclePlate = vehiclePlate; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }
}

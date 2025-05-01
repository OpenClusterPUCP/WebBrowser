package org.example.proyectocloud.DTO.Admin.Flavors;

import java.io.Serializable;
import java.math.BigDecimal;

public class FlavorRequest implements Serializable {
    private String name;
    private Integer ram;
    private Integer vcpu;
    private BigDecimal disk;
    private String type;  // Debe ser "public" o "private"
    private Integer userId;  // Requerido solo para flavors de tipo "private"

    // Getters y setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getRam() {
        return ram;
    }

    public void setRam(Integer ram) {
        this.ram = ram;
    }

    public Integer getVcpu() {
        return vcpu;
    }

    public void setVcpu(Integer vcpu) {
        this.vcpu = vcpu;
    }

    public BigDecimal getDisk() {
        return disk;
    }

    public void setDisk(BigDecimal disk) {
        this.disk = disk;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }
}
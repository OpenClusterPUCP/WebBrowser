package org.example.proyectocloud.DTO.Admin.Zones;

public class SliceDTO {

    private int id;
    private String name;
    private String owner;
    private String type; // Ej: "Lineal", "Anillo", etc.
    private int vmCount;

    private int assignedVcpu;
    private int assignedRam;
    private int assignedDisk;

    private String createdDate; // formato: "dd/MM/yyyy"
    private String status; // Ej: "Activo", "Inactivo"

    public SliceDTO(String name, String owner, String type, int vmCount, int assignedVcpu, int assignedRam, int assignedDisk, String createdDate, String status) {
        this.name = name;
        this.owner = owner;
        this.type = type;
        this.vmCount = vmCount;
        this.assignedVcpu = assignedVcpu;
        this.assignedRam = assignedRam;
        this.assignedDisk = assignedDisk;
        this.createdDate = createdDate;
        this.status = status;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getVmCount() {
        return vmCount;
    }

    public void setVmCount(int vmCount) {
        this.vmCount = vmCount;
    }

    public int getAssignedVcpu() {
        return assignedVcpu;
    }

    public void setAssignedVcpu(int assignedVcpu) {
        this.assignedVcpu = assignedVcpu;
    }

    public int getAssignedRam() {
        return assignedRam;
    }

    public void setAssignedRam(int assignedRam) {
        this.assignedRam = assignedRam;
    }

    public int getAssignedDisk() {
        return assignedDisk;
    }

    public void setAssignedDisk(int assignedDisk) {
        this.assignedDisk = assignedDisk;
    }

    public String getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(String createdDate) {
        this.createdDate = createdDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

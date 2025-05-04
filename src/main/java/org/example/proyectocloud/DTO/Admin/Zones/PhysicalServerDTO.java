package org.example.proyectocloud.DTO.Admin.Zones;

public class PhysicalServerDTO {

    private int id;
    private String hostname;
    private String ip;
    private String status; // Ej: "Online", "Offline", etc.
    private int totalVcpu;
    private int usedVcpu;
    private int totalRam;
    private int usedRam;
    private int totalDisk;
    private int usedDisk;
    private int vmCount;

    public PhysicalServerDTO(String hostname, String ip, String status, int totalVcpu, int usedVcpu, int totalRam, int usedRam, int totalDisk, int usedDisk, int vmCount) {
        this.hostname = hostname;
        this.ip = ip;
        this.status = status;
        this.totalVcpu = totalVcpu;
        this.usedVcpu = usedVcpu;
        this.totalRam = totalRam;
        this.usedRam = usedRam;
        this.totalDisk = totalDisk;
        this.usedDisk = usedDisk;
        this.vmCount = vmCount;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getTotalVcpu() {
        return totalVcpu;
    }

    public void setTotalVcpu(int totalVcpu) {
        this.totalVcpu = totalVcpu;
    }

    public int getUsedVcpu() {
        return usedVcpu;
    }

    public void setUsedVcpu(int usedVcpu) {
        this.usedVcpu = usedVcpu;
    }

    public int getTotalRam() {
        return totalRam;
    }

    public void setTotalRam(int totalRam) {
        this.totalRam = totalRam;
    }

    public int getUsedRam() {
        return usedRam;
    }

    public void setUsedRam(int usedRam) {
        this.usedRam = usedRam;
    }

    public int getTotalDisk() {
        return totalDisk;
    }

    public void setTotalDisk(int totalDisk) {
        this.totalDisk = totalDisk;
    }

    public int getUsedDisk() {
        return usedDisk;
    }

    public void setUsedDisk(int usedDisk) {
        this.usedDisk = usedDisk;
    }

    public int getVmCount() {
        return vmCount;
    }

    public void setVmCount(int vmCount) {
        this.vmCount = vmCount;
    }
}

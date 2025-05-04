package org.example.proyectocloud.DTO.Admin.Zones;

public class ZoneDTO {
    private Integer id;
    private String name;
    private String description;

    private int totalVMs=0;
    private int serverCount=0;
    private int sliceCount=0;

    private int totalVcpu=0;
    private int usedVcpu=0;
    private int totalRam=0;
    private int usedRam=0;
    private int totalDisk=0;
    private int usedDisk=0;

    public ZoneDTO(Integer id, String name, String description, int totalVMs, int serverCount, int sliceCount, int totalVcpu, int usedVcpu, int totalRam, int usedRam, int totalDisk, int usedDisk) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.totalVMs = totalVMs;
        this.serverCount = serverCount;
        this.sliceCount = sliceCount;
        this.totalVcpu = totalVcpu;
        this.usedVcpu = usedVcpu;
        this.totalRam = totalRam;
        this.usedRam = usedRam;
        this.totalDisk = totalDisk;
        this.usedDisk = usedDisk;
    }

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getTotalVMs() {
        return totalVMs;
    }

    public void setTotalVMs(int totalVMs) {
        this.totalVMs = totalVMs;
    }

    public int getServerCount() {
        return serverCount;
    }

    public void setServerCount(int serverCount) {
        this.serverCount = serverCount;
    }

    public int getSliceCount() {
        return sliceCount;
    }

    public void setSliceCount(int sliceCount) {
        this.sliceCount = sliceCount;
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
}

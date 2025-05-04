package org.example.proyectocloud.DTO.Admin.Zones;

public class GlobalResourceStatsDTO {
    private int totalCpu;
    private int usedCpu;
    private int totalRam;
    private int usedRam;
    private int totalDisk;
    private int usedDisk;
    private int totalServers;

    public GlobalResourceStatsDTO(int totalCpu, int usedCpu, int totalRam, int usedRam, int totalDisk, int usedDisk, int totalServers) {
        this.totalCpu = totalCpu;
        this.usedCpu = usedCpu;
        this.totalRam = totalRam;
        this.usedRam = usedRam;
        this.totalDisk = totalDisk;
        this.usedDisk = usedDisk;
        this.totalServers = totalServers;
    }

    public int getTotalCpu() {
        return totalCpu;
    }

    public void setTotalCpu(int totalCpu) {
        this.totalCpu = totalCpu;
    }

    public int getUsedCpu() {
        return usedCpu;
    }

    public void setUsedCpu(int usedCpu) {
        this.usedCpu = usedCpu;
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

    public int getTotalServers() {
        return totalServers;
    }

    public void setTotalServers(int totalServers) {
        this.totalServers = totalServers;
    }

    public int getCpuUsagePercent() {
        return totalCpu == 0 ? 0 : (usedCpu * 100) / totalCpu;
    }

    public int getRamUsagePercent() {
        return totalRam == 0 ? 0 : (usedRam * 100) / totalRam;
    }

    public int getDiskUsagePercent() {
        return totalDisk == 0 ? 0 : (usedDisk * 100) / totalDisk;
    }
}


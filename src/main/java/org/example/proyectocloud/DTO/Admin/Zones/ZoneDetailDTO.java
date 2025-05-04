package org.example.proyectocloud.DTO.Admin.Zones;

import java.util.List;

public class ZoneDetailDTO {

    private int id;
    private String name;
    private String description;
    private int serverCount;
    private int totalVMs;
    private int totalSlices;

    private int totalVcpu;
    private int usedVcpu;

    private int totalRam;
    private int usedRam;

    private int totalDisk;
    private int usedDisk;

    private List<PhysicalServerDTO> servers;
    private List<SliceDTO> slices;

    public ZoneDetailDTO(String name, String description, int serverCount, int totalVMs, int totalSlices,
                         int totalVcpu, int usedVcpu,
                         int totalRam, int usedRam,
                         int totalDisk, int usedDisk,
                         List<PhysicalServerDTO> servers, List<SliceDTO> slices) {
        this.name = name;
        this.description = description;
        this.serverCount = serverCount;
        this.totalVMs = totalVMs;
        this.totalSlices = totalSlices;
        this.totalVcpu = totalVcpu;
        this.usedVcpu = usedVcpu;
        this.totalRam = totalRam;
        this.usedRam = usedRam;
        this.totalDisk = totalDisk;
        this.usedDisk = usedDisk;
        this.servers = servers;
        this.slices = slices;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getServerCount() {
        return serverCount;
    }

    public void setServerCount(int serverCount) {
        this.serverCount = serverCount;
    }

    public int getTotalVMs() {
        return totalVMs;
    }

    public void setTotalVMs(int totalVMs) {
        this.totalVMs = totalVMs;
    }

    public int getTotalSlices() {
        return totalSlices;
    }

    public void setTotalSlices(int totalSlices) {
        this.totalSlices = totalSlices;
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

    public List<PhysicalServerDTO> getServers() {
        return servers;
    }

    public void setServers(List<PhysicalServerDTO> servers) {
        this.servers = servers;
    }

    public List<SliceDTO> getSlices() {
        return slices;
    }

    public void setSlices(List<SliceDTO> slices) {
        this.slices = slices;
    }
}

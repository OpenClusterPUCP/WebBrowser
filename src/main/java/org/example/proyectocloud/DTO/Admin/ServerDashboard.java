package org.example.proyectocloud.DTO.Admin;

import java.util.Map;

public class ServerDashboard {
    private String ip;
    private Map<String, String> panelIframes;

    // Constructor
    public ServerDashboard(String ip, Map<String, String> panelIframes) {
        this.ip = ip;
        this.panelIframes = panelIframes;
    }

    // Getters
    public String getIp() {
        return ip;
    }

    public Map<String, String> getPanelIframes() {
        return panelIframes;
    }
}


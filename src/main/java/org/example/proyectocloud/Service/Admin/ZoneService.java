package org.example.proyectocloud.Service.Admin;

import lombok.Value;
import org.example.proyectocloud.DTO.Admin.Zones.GlobalResourceStatsDTO;
import org.example.proyectocloud.DTO.Admin.Zones.ZoneDTO;
import org.example.proyectocloud.DTO.Admin.Zones.ZoneDetailDTO;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Service
public class ZoneService {

    private final RestTemplate restTemplate;

    private static final String API_GATEWAY_URL = "http://localhost:8090";

    public ZoneService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<ZoneDTO> getAllZones(String token) {
        String url = API_GATEWAY_URL + "/api/admin/zones/all";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<ZoneDTO[]> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                ZoneDTO[].class
        );

        return Arrays.asList(response.getBody());
    }

    public GlobalResourceStatsDTO getGlobalStats(String token) {
        List<ZoneDTO> zones = getAllZones(token); // Usar el token correctamente

        int totalCpu = zones.stream().mapToInt(ZoneDTO::getTotalVcpu).sum();
        int usedCpu = zones.stream().mapToInt(ZoneDTO::getUsedVcpu).sum();

        int totalRam = zones.stream().mapToInt(ZoneDTO::getTotalRam).sum();
        int usedRam = zones.stream().mapToInt(ZoneDTO::getUsedRam).sum();

        int totalDisk = zones.stream().mapToInt(ZoneDTO::getTotalDisk).sum();
        int usedDisk = zones.stream().mapToInt(ZoneDTO::getUsedDisk).sum();

        int totalServers = zones.stream().mapToInt(ZoneDTO::getServerCount).sum();

        return new GlobalResourceStatsDTO(
                totalCpu, usedCpu,
                totalRam, usedRam,
                totalDisk, usedDisk,
                totalServers
        );
    }

    public ZoneDetailDTO getZoneDetailById(Integer id, String token) {
        String url = API_GATEWAY_URL + "/api/admin/zones/zone_service/" + id;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<ZoneDetailDTO> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                ZoneDetailDTO.class
        );

        return response.getBody();
    }







}

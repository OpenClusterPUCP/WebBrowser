package org.example.proyectocloud.Service.Admin;

import lombok.Value;
import org.example.proyectocloud.DTO.Admin.Zones.ZoneDTO;
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

}

package org.example.proyectocloud.Service.Admin;

import org.example.proyectocloud.DTO.Admin.Zones.ServerInfoDTO;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;

@Service
public class PhysicalServerService {

    private final RestTemplate restTemplate;


    public PhysicalServerService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private static final String API_GATEWAY_URL = "http://localhost:8090";

    public List<ServerInfoDTO> getServersByZone(Integer zoneId, String token) {
        String url = API_GATEWAY_URL + "/api/admin/physicalServer/byZone/" + zoneId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<ServerInfoDTO[]> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                ServerInfoDTO[].class
        );

        ServerInfoDTO[] servers = response.getBody();
        return Arrays.asList(servers != null ? servers : new ServerInfoDTO[0]);
    }

    public ArrayList<LinkedHashMap<String , Object >> getAllServers(String token) {
        String url = API_GATEWAY_URL + "/servers/all";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<ArrayList> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                ArrayList.class
        );

        ArrayList<LinkedHashMap<String , Object >> lista = response.getBody();
        return lista;
    }
    public String update(Integer idServer , Integer idAz ,String token) {
        String url = API_GATEWAY_URL + "/update/server/"+ idServer + "/" +  idAz;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
        );

        String rpta = response.getBody();
        return rpta;
    }
}

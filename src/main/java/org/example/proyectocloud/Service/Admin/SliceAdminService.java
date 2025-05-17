package org.example.proyectocloud.Service.Admin;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SliceAdminService {

    private final RestTemplate restTemplate;

    public SliceAdminService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    @Value("${api.gateway.url}")
    private String API_GATEWAY_URL;

    public Object getAllSlices(String token) {
        String url = API_GATEWAY_URL + "/Admin/api/slices/list/";

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    List.class
            );

            List<Map<String, Object>> rawSlices = response.getBody();

            if (rawSlices != null) {
                List<Map<String, Object>> transformed = rawSlices.stream().map(slice -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", slice.get("id"));
                    map.put("nombre", slice.get("nombre"));
                    map.put("propietario", slice.get("propietario"));

                    // El campo topología es en realidad una descripción
                    map.put("topologia", slice.get("descripcion"));

                    // Asume que ya tienes vcpu y ram
                    Object vcpu = slice.get("vcpu");
                    Object ram = slice.get("ram");
                    map.put("recursos", (vcpu != null ? vcpu : "?") + " vCPU, " + (ram != null ? ram : "?") + "GB RAM");

                    // El estado viene como 'running' o 'stopped', etc.
                    map.put("estado", slice.get("estado"));

                    return map;
                }).collect(Collectors.toList());

                log.info("Se recibieron {} slices y se transformaron correctamente", transformed.size());
                return transformed;
            } else {
                log.warn("Respuesta nula desde el API Gateway");
                return Collections.emptyList();
            }

        } catch (Exception ex) {
            log.error("Error al consumir API de slices: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }





}

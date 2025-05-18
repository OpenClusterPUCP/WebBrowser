package org.example.proyectocloud.Service.User;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SliceService {
    private static final Logger log = LoggerFactory.getLogger(SliceService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${api.gateway.url}")
    private String API_GATEWAY_URL;

    private HttpHeaders createAuthHeaders(String token) {
        log.debug("Creando headers con token: {}", token);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        log.debug("Headers creados: {}", headers);
        return headers;
    }

    public Object listSlices(String token, Integer userId) {
        log.info("Solicitando lista de slices para usuario ID: {} con token: {}", userId, token);
        
        String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/list-slices")
            .queryParam("user_id", userId)
            .toUriString();
        
        log.info("URL construida: {}", url);

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);
        log.info("Request entity creado: {}", entity);

        try {
            log.info("Enviando request al gateway...");
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                LinkedHashMap.class
            );
            log.info("Respuesta recibida: {}", response);

            return response.getBody();
        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al obtener slices: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            log.error("Headers de la respuesta: {}", ex.getResponseHeaders());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al obtener slices: {}", ex.getMessage(), ex);
            throw ex;
        }
    }

    public Object deploySlice(String token, Map<String, Object> sliceData) {
        log.info("Solicitando despliegue de slice con data: {}", sliceData);

        String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/deploy-slice")
            .toUriString();

        log.info("URL construida: {}", url);

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(sliceData, headers);

        log.info("Enviando request al gateway...");
        log.info("URL: {}", url);
        log.info("Headers: {}", headers);
        log.info("Request body: {}", sliceData);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
        );

        log.info("Response status: {}", response.getStatusCode());
        log.info("Response headers: {}", response.getHeaders());
        log.info("Response body: {}", response.getBody());

        log.info("Respuesta raw recibida: {}", response.getBody());

        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.error("Error al procesar JSON de respuesta: {}", e.getMessage());
            log.error("Contenido de respuesta: {}", response.getBody());

            // Return a controlled error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Error al procesar respuesta del servidor");
            errorResponse.put("details", e.getMessage());
            errorResponse.put("rawResponse", response.getBody());
            return errorResponse;
        }

    }

    public Object getSliceDetails(String token, Integer sliceId, Integer userId) {
        try {
            String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/slice/" + sliceId)
            .queryParam("user_id", userId)
            .toUriString();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            return response.getBody();
        } catch (Exception ex) {
            log.error("Error al obtener detalles del slice: {}", ex.getMessage(), ex);
            throw ex;
        }
    }

    public Object pauseVM(String token, Integer vmId, Integer userId) {
        try {
            String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "//slice-manager/pause-vm/" + vmId)
            .queryParam("user_id", userId)
            .toUriString();

            HttpHeaders headers = createAuthHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                LinkedHashMap.class
            );
            
            return response.getBody();
        } catch (Exception ex) {
            log.error("Error al pausar VM: {}", ex.getMessage(), ex);
            throw ex;
        }
    }
    
    public Object resumeVM(String token, Integer vmId, Integer userId) {
        try {
            String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/resume-vm/" + vmId)
            .queryParam("user_id", userId)
            .toUriString();
            
            HttpHeaders headers = createAuthHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                LinkedHashMap.class
            );
            
            return response.getBody();
        } catch (Exception ex) {
            log.error("Error al resumir VM: {}", ex.getMessage(), ex);
            throw ex;
        }
    }
    
    public Object restartVM(String token, Integer vmId, Integer userId) {
        try {
            String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/restart-vm/" + vmId)
            .queryParam("user_id", userId)
            .toUriString();
           
            HttpHeaders headers = createAuthHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                LinkedHashMap.class
            );
            
            return response.getBody();
        } catch (Exception ex) {
            log.error("Error al reiniciar VM: {}", ex.getMessage(), ex);
            throw ex;
        }
    }
    
    public Object restartSlice(String token, Integer sliceId, Integer userId) {
        try {
            String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/restart-slice/" + sliceId)
            .queryParam("user_id", userId)
            .toUriString();
            
            HttpHeaders headers = createAuthHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                LinkedHashMap.class
            );
            
            return response.getBody();
        } catch (Exception ex) {
            log.error("Error al reiniciar slice: {}", ex.getMessage(), ex);
            throw ex;
        }
    }
    
    public Object stopSlice(String token, Integer sliceId, Integer userId) {
        try {
            String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/stop-slice/" + sliceId)
            .queryParam("user_id", userId)
            .toUriString();
            
            HttpHeaders headers = createAuthHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                LinkedHashMap.class
            );
            
            return response.getBody();
        } catch (Exception ex) {
            log.error("Error al detener slice: {}", ex.getMessage(), ex);
            throw ex;
        }
    }

    public Object getVMDetails(String token, Integer vmId, Integer userId) {
        log.info("Obteniendo detalles de VM {} para usuario {}", vmId, userId);

        String url = UriComponentsBuilder
                .fromUriString(API_GATEWAY_URL + "/slice-manager/vm/" + vmId)
                .queryParam("user_id", userId)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<Object> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                Object.class
            );
            
            log.info("Respuesta del backend para VM {}: {}", vmId, response.getBody());
            return response.getBody();
            
        } catch (HttpClientErrorException e) {
            log.error("Error del cliente HTTP al obtener detalles de VM: {}", e.getMessage());
            throw new RuntimeException("Error al obtener detalles de VM: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error al obtener detalles de VM: {}", e.getMessage());
            throw new RuntimeException("Error inesperado al obtener detalles de VM");
        }
    }
    
    public Object getVMVncUrl(String tokenVM, String tokenUser, Integer vmId, Integer userId) {
        try {
            String url = UriComponentsBuilder
                .fromUriString(API_GATEWAY_URL + "/slice-manager/vm-vnc/" + vmId)
                .queryParam("user_id", userId)
                .queryParam("token", tokenVM)
                .toUriString();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(tokenUser);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            return response.getBody();
        } catch (Exception ex) {
            log.error("Error al obtener URL VNC: {}", ex.getMessage(), ex);
            throw ex;
        }
    }
}
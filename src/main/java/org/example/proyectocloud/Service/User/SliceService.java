package org.example.proyectocloud.Service.User;

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
        log.info("Solicitando despliegue de slice");

        String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/deploy-slice")
            .toUriString();
        
        log.info("URL construida: {}", url);

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(sliceData, headers);

        try {
            log.info("Enviando request al gateway...");
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                LinkedHashMap.class
            );
            log.info("Respuesta recibida: {}", response.getBody());

            return response.getBody();
        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al desplegar slice: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            log.error("Headers de la respuesta: {}", ex.getResponseHeaders());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al desplegar slice: {}", ex.getMessage(), ex);
            throw ex;
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
    
    public Object getVMToken(String token, Integer vmId, Integer userId) {
        try {
            String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/vm-token/" + vmId)
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
            log.error("Error al obtener token de VM: {}", ex.getMessage(), ex);
            throw ex;
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
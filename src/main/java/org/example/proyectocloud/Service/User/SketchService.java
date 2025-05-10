package org.example.proyectocloud.Service.User;

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

import java.util.*;

@Service
public class SketchService {
    private static final Logger log = LoggerFactory.getLogger(SketchService.class);

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

    public Object listSketches(String token, Integer userId) {
        log.info("Solicitando lista de sketches para usuario ID: {} con token: {}", userId, token);
        
        String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/list-sketches")
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
            log.error("Error HTTP al obtener sketches: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            log.error("Headers de la respuesta: {}", ex.getResponseHeaders());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al obtener sketches: {}", ex.getMessage(), ex);
            throw ex;
        }
    }

    public Object createSketch(String token, Map<String, Object> sketchData, Integer userId) {
        log.info("Creando sketch para usuario ID: {}", userId);
        String url = API_GATEWAY_URL + "/slice-manager/create-sketch";

        sketchData.put("user_id", userId);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(sketchData, createAuthHeaders(token));

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    LinkedHashMap.class
            );

            return response.getBody();

        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al crear sketch: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al crear sketch: {}", ex.getMessage());
            throw ex;
        }
    }

    public Object getSketch(String token, Integer sketchId, Integer userId) {
        log.info("Obteniendo sketch ID: {} para usuario ID: {}", sketchId, userId);
        String url = UriComponentsBuilder.fromUriString(API_GATEWAY_URL + "/slice-manager/sketch/" + sketchId)
                .queryParam("user_id", userId)
                .toUriString();

        HttpEntity<String> entity = new HttpEntity<>(null, createAuthHeaders(token));

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    LinkedHashMap.class
            );

            return response.getBody();

        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al obtener sketch: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al obtener sketch: {}", ex.getMessage());
            throw ex;
        }
    }

    public Object updateSketch(String token, Integer sketchId, Integer userId, Map<String, Object> sketchData) {
        log.info("Actualizando sketch ID: {} para usuario ID: {}", sketchId, userId);
        
        String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/sketch/" + sketchId)
            .queryParam("user_id", userId)
            .toUriString();

        sketchData.put("user_id", userId);
    
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(sketchData, createAuthHeaders(token));
    
        try {
            log.debug("Enviando request de actualización con datos: {}", sketchData);
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                entity,
                LinkedHashMap.class
            );
    
            log.info("Sketch actualizado exitosamente");
            return response.getBody();
    
        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al actualizar sketch: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al actualizar sketch: {}", ex.getMessage());
            throw ex;
        }
    }

    public Object deleteSketch(String token, Integer sketchId, Integer userId) {
        log.info("Eliminando sketch ID: {} para usuario ID: {}", sketchId, userId);
        String url = UriComponentsBuilder.fromUriString(API_GATEWAY_URL + "/slice-manager/sketch/" + sketchId)
                .queryParam("user_id", userId)
                .toUriString();

        HttpEntity<String> entity = new HttpEntity<>(null, createAuthHeaders(token));

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    entity,
                    LinkedHashMap.class
            );

            return response.getBody();

        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al eliminar sketch: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al eliminar sketch: {}", ex.getMessage());
            throw ex;
        }
    }

    public Map<String, Object> getFlavors(String token, Integer userId) {
        log.info("Solicitando lista de flavors para usuario ID: {}", userId);
        String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/resources/flavors")
            .queryParam("user_id", userId)
            .toUriString();
    
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);
    
        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                LinkedHashMap.class
            );
    
            LinkedHashMap<String, Object> responseBody = response.getBody();
            return Collections.singletonMap("data", responseBody.get("content"));
    
        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al obtener flavors: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al obtener flavors: {}", ex.getMessage());
            throw ex;
        }
    }
    
    public Map<String, Object> getImages(String token, Integer userId) {
        log.info("Solicitando lista de imágenes para usuario ID: {}", userId);
        String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/resources/images")
            .queryParam("user_id", userId)
            .toUriString();
    
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);
    
        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                LinkedHashMap.class
            );
    
            LinkedHashMap<String, Object> responseBody = response.getBody();
            return Collections.singletonMap("data", responseBody.get("content"));
    
        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al obtener imágenes: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al obtener imágenes: {}", ex.getMessage());
            throw ex;
        }
    }

}
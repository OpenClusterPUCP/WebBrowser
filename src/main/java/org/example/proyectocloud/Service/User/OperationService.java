package org.example.proyectocloud.Service.User;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Service
public class OperationService {
    private static final Logger log = LoggerFactory.getLogger(OperationService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${api.gateway.url}")
    private String API_GATEWAY_URL;

    /**
     * Crea los headers de autenticación
     */
    private HttpHeaders createAuthHeaders(String token) {
        log.debug("Creando headers con token: {}", token);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        log.debug("Headers creados: {}", headers);
        return headers;
    }

    /**
     * Consulta el estado de una operación específica
     */
    public Object getOperationStatus(String token, Long operationId) {
        log.info("Consultando estado de operación ID: {}", operationId);

        String url = UriComponentsBuilder
                .fromUriString(API_GATEWAY_URL + "/slice-manager/operations/" + operationId + "/status")
                .toUriString();

        log.info("URL construida: {}", url);

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);
        log.info("Request entity creado: {}", entity);

        try {
            log.info("Enviando request al gateway...");
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            log.info("Respuesta recibida: {}", response);

            // Convertir respuesta a Map
            ObjectMapper mapper = new ObjectMapper();
            try {
                return mapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
            } catch (JsonProcessingException e) {
                log.error("Error al procesar JSON de respuesta: {}", e.getMessage());
                throw new RuntimeException("Error al procesar la respuesta del servidor: " + e.getMessage(), e);
            }
        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al consultar estado de operación: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            log.error("Headers de la respuesta: {}", ex.getResponseHeaders());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al consultar estado de operación: {}", ex.getMessage(), ex);
            throw new RuntimeException("Error al consultar estado de operación: " + ex.getMessage(), ex);
        }
    }

    /**
     * Consulta las operaciones pendientes del usuario actual
     */
    public Object getUserPendingOperations(String token, Integer userId) {
        log.info("Consultando operaciones pendientes para usuario ID: {}", userId);

        String url = UriComponentsBuilder
                .fromUriString(API_GATEWAY_URL + "/slice-manager/user/pending-operations")
                .queryParam("user_id", userId)
                .toUriString();

        log.info("URL construida: {}", url);

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);
        log.info("Request entity creado: {}", entity);

        try {
            log.info("Enviando request al gateway...");
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            log.info("Respuesta recibida: {}", response);

            // Convertir respuesta a Map
            ObjectMapper mapper = new ObjectMapper();
            try {
                return mapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
            } catch (JsonProcessingException e) {
                log.error("Error al procesar JSON de respuesta: {}", e.getMessage());
                throw new RuntimeException("Error al procesar la respuesta del servidor: " + e.getMessage(), e);
            }
        } catch (HttpClientErrorException ex) {
            log.error("Error HTTP al consultar operaciones pendientes: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            log.error("Headers de la respuesta: {}", ex.getResponseHeaders());
            throw ex;
        } catch (Exception ex) {
            log.error("Error al consultar operaciones pendientes: {}", ex.getMessage(), ex);
            throw new RuntimeException("Error al consultar operaciones pendientes: " + ex.getMessage(), ex);
        }
    }
}
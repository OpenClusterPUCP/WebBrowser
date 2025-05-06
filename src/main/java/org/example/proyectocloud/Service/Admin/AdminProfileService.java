package org.example.proyectocloud.Service.Admin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para gestionar el perfil de administrador
 * Permite realizar operaciones como obtener, actualizar información personal y cambiar contraseña
 */
@Service
@Slf4j
public class AdminProfileService {

    @Autowired
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();

    // URL base para el API Gateway (inyectada desde application.properties)
    @Value("${apigateway.url:http://localhost:8090}")
    private String apiGatewayUrl;

    /**
     * Método auxiliar para crear headers de autorización con token JWT.
     *
     * @param token Token JWT para autenticación
     * @return Headers HTTP con autorización Bearer
     */
    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    /**
     * Método auxiliar para crear headers con autorización y contenido JSON.
     *
     * @param token Token JWT para autenticación
     * @return Headers HTTP con autorización Bearer y tipo de contenido JSON
     */
    private HttpHeaders createJsonAuthHeaders(String token) {
        HttpHeaders headers = createAuthHeaders(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    /**
     * Método auxiliar para manejar errores de forma estándar.
     *
     * @param message Mensaje descriptivo del error
     * @param ex Excepción capturada
     * @return Mapa con información del error
     */
    private Map<String, Object> handleError(String message, Exception ex) {
        log.error("{}: {}", message, ex.getMessage());
        Map<String, Object> error = new HashMap<>();
        error.put("status", 500);
        error.put("message", message);
        error.put("details", ex.getMessage());
        return error;
    }

    /**
     * Método auxiliar para procesar respuestas HTTP como mapas.
     *
     * @param response Respuesta HTTP en formato String
     * @return Mapa con los datos de la respuesta
     */
    private Map<String, Object> processMapResponse(String response) {
        try {
            return objectMapper.readValue(response, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Error al procesar respuesta JSON: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("status", 500);
            error.put("message", "Error al procesar la respuesta");
            error.put("details", e.getMessage());
            return error;
        }
    }

    /**
     * Obtiene los datos del perfil del usuario.
     * Utiliza la ruta /api/admin/profile/{id} del API Gateway.
     *
     * @param userId ID del usuario (administrador)
     * @param token Token JWT para autenticación
     * @return Datos del perfil del usuario
     */
    public Map<String, Object> getUserProfile(Integer userId, String token) {
        log.info("Obteniendo perfil de usuario ID: {}", userId);

        if (token == null) {
            log.warn("Token no proporcionado");
            return createErrorResponse(401, "No autorizado - Token no proporcionado");
        }

        // Usar la ruta correcta del API Gateway para obtener perfil
        String url = apiGatewayUrl + "/api/admin/profile/" + userId;
        log.debug("Consultando perfil en URL: {}", url);

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            log.info("Perfil de usuario ID {} obtenido exitosamente", userId);
            return processMapResponse(response.getBody());
        } catch (HttpClientErrorException ex) {
            log.error("Error del cliente HTTP al obtener perfil de usuario ID {}: {} - {}",
                    userId, ex.getStatusCode(), ex.getResponseBodyAsString());
            return createErrorResponse(ex.getStatusCode().value(),
                    "Error al obtener perfil: " + ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("Error inesperado al obtener perfil de usuario: {}", ex.getMessage(), ex);
            return handleError("Error inesperado al obtener perfil de usuario", ex);
        }
    }

    /**
     * Actualiza la información del perfil del usuario.
     * Utiliza la ruta /api/admin/profile/update del API Gateway.
     *
     * @param profileData Datos actualizados del perfil
     * @param token Token JWT para autenticación
     * @return Resultado de la operación
     */
    public Map<String, Object> updateProfile(Map<String, Object> profileData, String token) {
        Integer userId = (Integer) profileData.get("id");
        log.info("Actualizando perfil de usuario ID: {}", userId);

        if (token == null) {
            log.warn("Token no proporcionado");
            return createErrorResponse(401, "No autorizado - Token no proporcionado");
        }

        // Usar la ruta correcta del API Gateway para actualizar perfil
        String url = apiGatewayUrl + "/api/admin/profile/update";

        HttpHeaders headers = createJsonAuthHeaders(token);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(profileData, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.info("Perfil de usuario ID {} actualizado exitosamente", userId);
            return processMapResponse(response.getBody());
        } catch (HttpClientErrorException ex) {
            log.error("Error del cliente HTTP al actualizar perfil de usuario ID {}: {}", userId, ex.getStatusCode());
            return createErrorResponse(ex.getStatusCode().value(),
                    "Error al actualizar perfil: " + ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return handleError("Error inesperado al actualizar perfil de usuario", ex);
        }
    }

    /**
     * Cambia la contraseña del usuario.
     * Utiliza la ruta /api/admin/profile/password del API Gateway.
     *
     * @param passwordData Datos de cambio de contraseña
     * @param token Token JWT para autenticación
     * @return Resultado de la operación
     */
    public Map<String, Object> changePassword(Map<String, Object> passwordData, String token) {
        log.info("Cambiando contraseña de usuario");

        if (token == null) {
            log.warn("Token no proporcionado");
            return createErrorResponse(401, "No autorizado - Token no proporcionado");
        }

        // Usar la ruta correcta del API Gateway para cambiar contraseña
        String url = apiGatewayUrl + "/api/admin/profile/password";

        HttpHeaders headers = createJsonAuthHeaders(token);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(passwordData, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.info("Contraseña de usuario actualizada exitosamente");
            return processMapResponse(response.getBody());
        } catch (HttpClientErrorException ex) {
            log.error("Error del cliente HTTP al cambiar contraseña: {}", ex.getStatusCode());
            return createErrorResponse(ex.getStatusCode().value(),
                    "Error al cambiar contraseña: " + ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return handleError("Error inesperado al cambiar contraseña de usuario", ex);
        }
    }

    /**
     * Obtiene las métricas de actividad del usuario administrador.
     * Utiliza la ruta /api/admin/profile/metrics/{id} del API Gateway.
     *
     * @param userId ID del usuario administrador
     * @param token Token JWT para autenticación
     * @return Métricas de actividad del administrador
     */
    public Map<String, Object> getAdminMetrics(Integer userId, String token) {
        log.info("Obteniendo métricas de actividad para administrador ID: {}", userId);

        if (token == null) {
            log.warn("Token no proporcionado");
            return createErrorResponse(401, "No autorizado - Token no proporcionado");
        }

        // Usar la ruta correcta del API Gateway para obtener métricas
        String url = apiGatewayUrl + "/api/admin/profile/metrics/" + userId;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            log.info("Métricas de administrador ID {} obtenidas exitosamente", userId);
            return processMapResponse(response.getBody());
        } catch (HttpClientErrorException ex) {
            log.error("Error del cliente HTTP al obtener métricas de administrador ID {}: {}", userId, ex.getStatusCode());
            return createErrorResponse(ex.getStatusCode().value(),
                    "Error al obtener métricas: " + ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("Error inesperado al obtener métricas: {}", ex.getMessage(), ex);
            return handleError("Error inesperado al obtener métricas de administrador", ex);
        }
    }

    /**
     * Método auxiliar para crear una respuesta de error estándar
     *
     * @param statusCode Código de estado HTTP
     * @param message Mensaje de error
     * @return Mapa con la información del error
     */
    private Map<String, Object> createErrorResponse(int statusCode, String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", statusCode);
        error.put("message", message);
        return error;
    }
}
package org.example.proyectocloud.Service.Auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class PasswordResetService {

    @Autowired
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();

    // URL base para el API Gateway - Usar @Value para mayor flexibilidad
    @Value("${api.gateway.url}")
    private String apiGatewayUrl;

    @Value("${password.reset.redirect.url}")
    private String passwordResetRedirectUrl;

    /**
     * Método auxiliar para crear headers HTTP básicos.
     *
     * @return Headers HTTP básicos
     */
    private HttpHeaders createBasicHeaders() {
        HttpHeaders headers = new HttpHeaders();
        return headers;
    }

    /**
     * Método auxiliar para crear headers con contenido JSON.
     *
     * @return Headers HTTP con tipo de contenido JSON
     */
    private HttpHeaders createJsonHeaders() {
        HttpHeaders headers = createBasicHeaders();
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
        error.put("status", "error");
        error.put("code", 500);
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
            error.put("status", "error");
            error.put("code", 500);
            error.put("message", "Error al procesar la respuesta");
            error.put("details", e.getMessage());
            return error;
        }
    }

    /**
     * Solicita el restablecimiento de contraseña para un correo electrónico.
     * Este método no requiere autenticación ya que es una operación pública.
     *
     * @param email Correo electrónico del usuario
     * @return Mapa con el resultado de la operación
     */
    public Map<String, Object> requestPasswordReset(String email) {
        log.info("Solicitando restablecimiento de contraseña para: {}", email);
        String url = apiGatewayUrl + "/api/public/auth/password/reset-request";

        HttpHeaders headers = createJsonHeaders();

        // Crear el body de la petición
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("email", email);
        requestBody.put("redirectUrl", passwordResetRedirectUrl);  // URL parametrizada

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.info("Solicitud de restablecimiento de contraseña enviada para: {}", email);
            Map<String, Object> result = new HashMap<>();

            // Intentamos procesar la respuesta como JSON, si falla retornamos un mapa simplificado
            try {
                result = processMapResponse(response.getBody());
            } catch (Exception e) {
                log.warn("No se pudo procesar la respuesta como JSON, usando respuesta simplificada");
                result.put("message", "Solicitud de restablecimiento enviada correctamente");
            }

            result.put("status", "success");
            return result;
        } catch (HttpClientErrorException ex) {
            log.error("Error al solicitar restablecimiento de contraseña para {}: {}", email, ex.getStatusCode());

            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("code", ex.getStatusCode().value());

            // Procesamos el cuerpo de la respuesta para obtener el mensaje de error
            try {
                Map<String, Object> responseBody = objectMapper.readValue(
                        ex.getResponseBodyAsString(),
                        new TypeReference<Map<String, Object>>() {}
                );

                if (responseBody.containsKey("message")) {
                    error.put("message", responseBody.get("message"));
                } else {
                    error.put("message", "Error al solicitar restablecimiento de contraseña");
                }
            } catch (Exception e) {
                error.put("message", "Error al solicitar restablecimiento de contraseña");
            }

            return error;
        } catch (Exception ex) {
            return handleError("Error inesperado al solicitar restablecimiento de contraseña", ex);
        }
    }

    /**
     * Verifica un token de restablecimiento de contraseña.
     * Este método no requiere autenticación ya que es una operación pública.
     *
     * @param token Token de restablecimiento
     * @return Mapa con el resultado de la verificación
     */
    public Map<String, Object> verifyResetToken(String token) {
        log.info("Verificando token de restablecimiento de contraseña");
        String url = apiGatewayUrl + "/api/public/auth/password/verify-token/" + token;

        HttpHeaders headers = createBasicHeaders();
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            log.info("Token de restablecimiento verificado correctamente");
            Map<String, Object> result;

            // Intentamos procesar la respuesta como JSON, si falla retornamos un mapa simplificado
            try {
                result = processMapResponse(response.getBody());
            } catch (Exception e) {
                log.warn("No se pudo procesar la respuesta como JSON, usando respuesta simplificada");
                result = new HashMap<>();
                result.put("email", ""); // Email vacío para manejar casos donde el servicio no lo devuelve
            }

            result.put("status", "success");
            return result;
        } catch (HttpClientErrorException ex) {
            log.error("Error al verificar token de restablecimiento: {}", ex.getStatusCode());
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("code", ex.getStatusCode().value());
            error.put("message", "Token inválido o expirado");
            return error;
        } catch (Exception ex) {
            return handleError("Error inesperado al verificar token de restablecimiento", ex);
        }
    }

    /**
     * Establece una nueva contraseña usando un token de restablecimiento.
     * Este método no requiere autenticación ya que es una operación pública.
     *
     * @param token Token de restablecimiento
     * @param newPassword Nueva contraseña
     * @return Mapa con el resultado de la operación
     */
    public Map<String, Object> resetPassword(String token, String newPassword) {
        log.info("Estableciendo nueva contraseña con token de restablecimiento");
        String url = apiGatewayUrl + "/api/public/auth/password/reset";

        HttpHeaders headers = createJsonHeaders();

        // Crear el body de la petición
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("token", token);
        requestBody.put("newPassword", newPassword);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.info("Contraseña restablecida correctamente");
            Map<String, Object> result;

            // Intentamos procesar la respuesta como JSON, si falla retornamos un mapa simplificado
            try {
                result = processMapResponse(response.getBody());
            } catch (Exception e) {
                log.warn("No se pudo procesar la respuesta como JSON, usando respuesta simplificada");
                result = new HashMap<>();
                result.put("message", "Contraseña restablecida correctamente");
            }

            result.put("status", "success");
            return result;
        } catch (HttpClientErrorException ex) {
            log.error("Error al restablecer contraseña: {}", ex.getStatusCode());
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("code", ex.getStatusCode().value());

            try {
                Map<String, Object> responseBody = objectMapper.readValue(
                        ex.getResponseBodyAsString(),
                        new TypeReference<Map<String, Object>>() {}
                );

                if (responseBody.containsKey("message")) {
                    error.put("message", responseBody.get("message"));
                } else {
                    error.put("message", "Error al restablecer la contraseña");
                }
            } catch (Exception e) {
                error.put("message", "Error al restablecer la contraseña");
            }

            return error;
        } catch (Exception ex) {
            return handleError("Error inesperado al restablecer contraseña", ex);
        }
    }
}
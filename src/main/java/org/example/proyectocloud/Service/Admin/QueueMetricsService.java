package org.example.proyectocloud.Service.Admin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class QueueMetricsService {

    @Autowired
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();

    // URL base para el API Gateway
    @Value("${api.gateway.url}")
    private String API_GATEWAY_URL;

    /**
     * Método auxiliar para crear headers de autorización con token JWT.
     */
    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    /**
     * Método auxiliar para manejar errores de forma estándar.
     */
    private Map<String, Object> handleError(String message, Exception ex) {
        log.error("{}: {}", message, ex.getMessage());
        Map<String, Object> error = new HashMap<>();
        error.put("status", 500);
        error.put("success", false);
        error.put("message", message);
        error.put("details", ex.getMessage());
        return error;
    }

    /**
     * Obtiene estadísticas de todas las colas del sistema.
     */
    public Map<String, Object> getAllQueueStats(String token) {
        log.info("Obteniendo estadísticas de todas las colas");
        String url = API_GATEWAY_URL + "/api/queue-metrics/stats/queues";

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            return objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            return handleError("Error al obtener estadísticas de colas", ex);
        }
    }

    /**
     * Obtiene estadísticas de una cola específica.
     */
    public Map<String, Object> getQueueStats(String queueName, String token) {
        log.info("Obteniendo estadísticas de la cola: {}", queueName);
        String url = API_GATEWAY_URL + "/api/queue-metrics/stats/queues/" + queueName;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            return objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            return handleError("Error al obtener estadísticas de la cola: " + queueName, ex);
        }
    }

    /**
     * Obtiene operaciones de un usuario específico.
     */
    public Map<String, Object> getUserOperations(Long userId, List<String> statuses, String token) {
        log.info("Obteniendo operaciones del usuario: {}", userId);

        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(API_GATEWAY_URL + "/api/queue-metrics/user/" + userId + "/operations");

        if (statuses != null && !statuses.isEmpty()) {
            builder.queryParam("statuses", String.join(",", statuses));
        }

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            return objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            return handleError("Error al obtener operaciones del usuario: " + userId, ex);
        }
    }

    /**
     * Obtiene el estado de una operación específica.
     */
    public Map<String, Object> getOperationStatus(Long operationId, String token) {
        log.info("Obteniendo estado de la operación: {}", operationId);
        String url = API_GATEWAY_URL + "/api/queue-metrics/operations/" + operationId;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            return objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            return handleError("Error al obtener estado de operación: " + operationId, ex);
        }
    }

    /**
     * Cancela una operación específica.
     */
    public Map<String, Object> cancelOperation(Long operationId, String token) {
        log.info("Cancelando operación: {}", operationId);
        String url = API_GATEWAY_URL + "/api/queue-metrics/operations/" + operationId;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    entity,
                    String.class
            );

            return objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            return handleError("Error al cancelar operación: " + operationId, ex);
        }
    }

    /**
     * Obtiene métricas resumidas para el dashboard.
     */
    public Map<String, Object> getDashboardMetrics(String token) {
        log.info("Obteniendo métricas resumidas para dashboard");

        try {
            Map<String, Object> allStats = getAllQueueStats(token);

            if (!(Boolean) allStats.getOrDefault("success", false)) {
                return allStats; // Retorna el error
            }

            List<Map<String, Object>> queues = (List<Map<String, Object>>) allStats.get("queues");

            // Calcular métricas agregadas
            long totalPending = 0;
            long totalInProgress = 0;
            long totalCompleted = 0;
            long totalFailed = 0;
            double avgWaitTime = 0;
            double avgProcessingTime = 0;
            int activeQueues = 0;

            for (Map<String, Object> queue : queues) {
                totalPending += ((Number) queue.getOrDefault("pendingOperations", 0)).longValue();
                totalInProgress += ((Number) queue.getOrDefault("inProgressOperations", 0)).longValue();
                totalCompleted += ((Number) queue.getOrDefault("completedOperations", 0)).longValue();
                totalFailed += ((Number) queue.getOrDefault("failedOperations", 0)).longValue();

                Double queueWaitTime = (Double) queue.get("averageWaitTimeSeconds");
                if (queueWaitTime != null && queueWaitTime > 0) {
                    avgWaitTime += queueWaitTime;
                    activeQueues++;
                }

                Double queueProcessingTime = (Double) queue.get("averageProcessingTimeSeconds");
                if (queueProcessingTime != null && queueProcessingTime > 0) {
                    avgProcessingTime += queueProcessingTime;
                }
            }

            // Calcular promedios
            if (activeQueues > 0) {
                avgWaitTime = avgWaitTime / activeQueues;
                avgProcessingTime = avgProcessingTime / activeQueues;
            }

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("success", true);
            dashboard.put("totalQueues", queues.size());
            dashboard.put("totalPending", totalPending);
            dashboard.put("totalInProgress", totalInProgress);
            dashboard.put("totalCompleted", totalCompleted);
            dashboard.put("totalFailed", totalFailed);
            dashboard.put("averageWaitTime", avgWaitTime);
            dashboard.put("averageProcessingTime", avgProcessingTime);
            dashboard.put("queues", queues);

            return dashboard;
        } catch (Exception ex) {
            return handleError("Error al obtener métricas del dashboard", ex);
        }
    }
}
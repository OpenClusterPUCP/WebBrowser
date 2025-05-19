package org.example.proyectocloud.Controller.Admin.Api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Service.Admin.QueueMetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/Admin/queue-metrics/api")
@Slf4j
public class AdminQueueMetricsRestController {

    @Autowired
    private QueueMetricsService queueMetricsService;

    /**
     * Obtiene métricas resumidas para el dashboard.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics(HttpServletRequest request) {
        log.info("API: Obteniendo métricas para dashboard");

        try {
            String token = getTokenFromSession(request);
            Map<String, Object> metrics = queueMetricsService.getDashboardMetrics(token);
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            log.error("Error al obtener métricas del dashboard", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error interno del servidor"));
        }
    }

    /**
     * Obtiene estadísticas de todas las colas.
     */
    @GetMapping("/stats/queues")
    public ResponseEntity<Map<String, Object>> getAllQueueStats(HttpServletRequest request) {
        log.info("API: Obteniendo estadísticas de todas las colas");

        try {
            String token = getTokenFromSession(request);
            Map<String, Object> stats = queueMetricsService.getAllQueueStats(token);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error al obtener estadísticas de colas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error interno del servidor"));
        }
    }

    /**
     * Obtiene estadísticas de una cola específica.
     */
    @GetMapping("/stats/queues/{queueName}")
    public ResponseEntity<Map<String, Object>> getQueueStats(
            @PathVariable String queueName,
            HttpServletRequest request) {
        log.info("API: Obteniendo estadísticas de la cola: {}", queueName);

        try {
            String token = getTokenFromSession(request);
            Map<String, Object> stats = queueMetricsService.getQueueStats(queueName, token);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error al obtener estadísticas de la cola: {}", queueName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error interno del servidor"));
        }
    }

    /**
     * Obtiene operaciones de un usuario específico.
     */
    @GetMapping("/user/{userId}/operations")
    public ResponseEntity<Map<String, Object>> getUserOperations(
            @PathVariable Long userId,
            @RequestParam(required = false) List<String> statuses,
            HttpServletRequest request) {
        log.info("API: Obteniendo operaciones del usuario: {}", userId);

        try {
            String token = getTokenFromSession(request);
            Map<String, Object> operations = queueMetricsService.getUserOperations(userId, statuses, token);
            return ResponseEntity.ok(operations);
        } catch (Exception e) {
            log.error("Error al obtener operaciones del usuario: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error interno del servidor"));
        }
    }

    /**
     * Obtiene el estado de una operación específica.
     */
    @GetMapping("/operations/{operationId}/status")
    public ResponseEntity<Map<String, Object>> getOperationStatus(
            @PathVariable Long operationId,
            HttpServletRequest request) {
        log.info("API: Obteniendo estado de operación: {}", operationId);

        try {
            String token = getTokenFromSession(request);
            Map<String, Object> status = queueMetricsService.getOperationStatus(operationId, token);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Error al obtener estado de operación: {}", operationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error interno del servidor"));
        }
    }

    /**
     * Cancela una operación específica.
     */
    @DeleteMapping("/operations/{operationId}")
    public ResponseEntity<Map<String, Object>> cancelOperation(
            @PathVariable Long operationId,
            HttpServletRequest request) {
        log.info("API: Cancelando operación: {}", operationId);

        try {
            String token = getTokenFromSession(request);
            Map<String, Object> result = queueMetricsService.cancelOperation(operationId, token);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error al cancelar operación: {}", operationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error interno del servidor"));
        }
    }

    // Constante para la clave del token en la sesión
    private static final String SESSION_TOKEN_KEY = "userInfo";
    private static final String SESSION_USER_ID_KEY = "userInfo";

    /**
     * Método auxiliar para obtener el token JWT de la sesión.
     */
    private String getTokenFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession();
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_TOKEN_KEY);

        if (userInfo == null || userInfo.getJwt() == null) {
            log.warn("No se encontró token en la sesión");
            throw new RuntimeException("Token JWT no encontrado en la sesión");
        }

        return userInfo.getJwt();
    }

    /**
     * Método auxiliar para obtener el ID del usuario de la sesión.
     */
    private Integer getUserIdFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession();
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_USER_ID_KEY);

        if (userInfo == null || userInfo.getId() == null) {
            log.warn("No se encontró ID de usuario en la sesión");
            throw new RuntimeException("ID de usuario no encontrado en la sesión");
        }

        return userInfo.getId();
    }
}
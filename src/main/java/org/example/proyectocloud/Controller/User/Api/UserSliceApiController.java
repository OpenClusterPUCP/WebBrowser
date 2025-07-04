package org.example.proyectocloud.Controller.User.Api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Service.User.OperationService;
import org.example.proyectocloud.Service.User.SliceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("User/api/slice")
@Slf4j
public class UserSliceApiController {

    @Autowired
    private SliceService sliceService;

    @Autowired
    private OperationService operationService;

    private static final String SESSION_TOKEN_KEY = "userInfo";
    private static final String SESSION_USER_ID_KEY = "userInfo";

    private String getTokenFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_TOKEN_KEY);
        if (userInfo.getJwt() == null) {
            log.warn("No se encontró token en la sesión");
        }
        log.info("Token recuperado de la sesión: {}", userInfo.getJwt());
        return userInfo.getJwt();
    }

    private Integer getUserIdFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_USER_ID_KEY);
        if (userInfo == null || userInfo.getId() == null) {
            log.warn("No se encontró ID de usuario en la sesión");
            return null;
        }
        return userInfo.getId();
    }

    @GetMapping("/list")
    @ResponseBody
    public ResponseEntity<?> listSlices(HttpSession session) {
        log.info("Recibida petición para listar slices");
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                log.warn("Token o userId no encontrado en sesión");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                        "status", "error",
                        "message", "Sesión no válida"
                    ));
            }

            Object result = sliceService.listSlices(token, userId);
            log.info("Respuesta del service: {}", result);
            
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error al obtener los slices: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
                ));
        }
    }

    @PostMapping("/deploy")
    @ResponseBody
    public ResponseEntity<?> deploySlice(@RequestBody Map<String, Object> sliceData, HttpSession session) {
        log.info("Recibida petición para desplegar slice");
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                log.warn("Token o userId no encontrado en sesión");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                        "status", "error",
                        "message", "Sesión no válida"
                    ));
            }

            // Agregar el user_id al slice_info
            if (sliceData.containsKey("slice_info")) {
                ((Map<String, Object>) sliceData.get("slice_info")).put("user_id", userId);
            }

            Object result = sliceService.deploySlice(token, sliceData);
            log.info("Respuesta del service: {}", result);
            
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return handleException(e, "Error al desplegar la Slice");
        }
    }

    @GetMapping("/{sliceId}")
    @ResponseBody
    public ResponseEntity<?> getSliceDetails(@PathVariable Integer sliceId, HttpSession session) {
        log.info("Recibida petición para obtener detalles del slice: {}", sliceId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                log.warn("Token o userId no encontrado en sesión");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                        "status", "error",
                        "message", "Sesión no válida"
                    ));
            }

            Object result = sliceService.getSliceDetails(token, sliceId, userId);
            log.info("Respuesta del service: {}", result);
            
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return handleException(e, "Error al obtener los detalles de la Slice");
        }
    }

    @PostMapping("/vm/{vmId}/pause")
    @ResponseBody
    public ResponseEntity<?> pauseVM(@PathVariable Integer vmId, HttpSession session) {
        log.info("Recibida petición para pausar VM: {}", vmId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Sesión no válida"));
            }

            Object result = sliceService.pauseVM(token, vmId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al apagar la VM");
        }
    }

    @PostMapping("/vm/{vmId}/resume")
    @ResponseBody
    public ResponseEntity<?> resumeVM(@PathVariable Integer vmId, HttpSession session) {
        log.info("Recibida petición para resumir VM: {}", vmId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Sesión no válida"));
            }

            Object result = sliceService.resumeVM(token, vmId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al encender la VM");
        }
    }

    @PostMapping("/vm/{vmId}/restart")
    @ResponseBody
    public ResponseEntity<?> restartVM(@PathVariable Integer vmId, HttpSession session) {
        log.info("Recibida petición para reiniciar VM: {}", vmId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Sesión no válida"));
            }

            Object result = sliceService.restartVM(token, vmId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al reiniciar la VM");
        }
    }

    @PostMapping("/{sliceId}/restart")
    @ResponseBody
    public ResponseEntity<?> restartSlice(@PathVariable Integer sliceId, HttpSession session) {
        log.info("Recibida petición para reiniciar Slice: {}", sliceId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Sesión no válida"));
            }

            Object result = sliceService.restartSlice(token, sliceId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al reiniciar la Slice");
        }
    }

    @PostMapping("/{sliceId}/stop")
    @ResponseBody
    public ResponseEntity<?> stopSlice(@PathVariable Integer sliceId, HttpSession session) {
        log.info("Recibida petición para detener slice: {}", sliceId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Sesión no válida"));
            }

            Object result = sliceService.stopSlice(token, sliceId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al detener la Slice");
        }
    }

    @GetMapping("/vm/{vmId}")
    @ResponseBody
    public ResponseEntity<?> getVMDetails(@PathVariable Integer vmId, HttpSession session) {
        log.info("Recibida petición para obtener detalles de VM: {}", vmId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Sesión no válida"));
            }

            Object result = sliceService.getVMDetails(token, vmId, userId);
            log.info("Respuesta del service para VM {}: {}", vmId, result);
            
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return handleException(e, "Error al obtener detalles de la VM");
        }
    }

    @GetMapping("/availability-zones")
    @ResponseBody
    public ResponseEntity<?> listAvailabilityZones(HttpSession session) {
        log.info("Recibida petición para listar zonas de disponibilidad");
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);

            if (token == null || userId == null) {
                log.warn("Token o userId no encontrado en sesión");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "status", "error",
                                "message", "Sesión no válida"
                        ));
            }

            Object result = sliceService.listAvailabilityZones(token, userId);
            log.info("Respuesta del service: {}", result);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error al obtener las zonas de disponibilidad: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "status", "error",
                            "message", "Ocurrió un error al obtener las zonas de disponibilidad",
                            "details", e.getMessage()
                    ));
        }
    }

    /**
     * Consulta el estado de una operación específica
     */
    @GetMapping("/operations/{operationId}/status")
    @ResponseBody
    public ResponseEntity<?> getOperationStatus(@PathVariable Long operationId, HttpSession session) {
        log.info("Recibida petición para consultar estado de operación ID: {}", operationId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);

            if (token == null || userId == null) {
                log.warn("Token o userId no encontrado en sesión");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "status", "error",
                                "message", "Sesión no válida"
                        ));
            }

            Object result = operationService.getOperationStatus(token, operationId);
            log.info("Respuesta del service para operación {}: {}", operationId, result);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error al consultar estado de la operación: {}", e.getMessage());
            return handleException(e, "Error al consultar estado de la operación");
        }
    }

    /**
     * Consulta las operaciones pendientes del usuario actual
     */
    @GetMapping("/user/pending-operations")
    @ResponseBody
    public ResponseEntity<?> getUserPendingOperations(HttpSession session) {
        log.info("Recibida petición para consultar operaciones pendientes del usuario");
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);

            if (token == null || userId == null) {
                log.warn("Token o userId no encontrado en sesión");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "status", "error",
                                "message", "Sesión no válida"
                        ));
            }

            Object result = operationService.getUserPendingOperations(token, userId);
            log.info("Respuesta del service para operaciones pendientes: {}", result);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error al consultar operaciones pendientes: {}", e.getMessage());
            return handleException(e, "Error al consultar operaciones pendientes");
        }
    }


    // Función útil para los mensajes de error:
    private ResponseEntity<?> handleException(Exception e, String errorPrefix) {
        log.error(errorPrefix + ": {}", e.getMessage());

        String errorMessage = e.getMessage();
        if (errorMessage != null && errorMessage.contains("{")) {
            try {
                String jsonPart = errorMessage.substring(
                        errorMessage.indexOf("{"),
                        errorMessage.lastIndexOf("}") + 1
                );

                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> errorResponse = mapper.readValue(
                        jsonPart,
                        new TypeReference<Map<String, Object>>() {}
                );

                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(errorResponse);

            } catch (Exception jsonException) {
                log.error("Error parsing JSON error message: {}", jsonException.getMessage());
            }
        }

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "status", "error",
                        "message", errorMessage
                ));
    }

}
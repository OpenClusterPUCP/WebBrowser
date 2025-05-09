package org.example.proyectocloud.Controller.User.Api;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
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
            log.error("Error al desplegar el slice: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
                ));
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
            log.error("Error al obtener los detalles del slice: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
                ));
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
            log.error("Error al pausar la VM: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
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
            log.error("Error al pausar la VM: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
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
            log.error("Error al pausar la VM: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
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
            log.error("Error al pausar la VM: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
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
            log.error("Error al pausar la VM: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/vm/{vmId}/token")
    @ResponseBody
    public ResponseEntity<?> getVMToken(@PathVariable Integer vmId, HttpSession session) {
        log.info("Recibida petición para obtener un token de acceso a consola/pantall de VM: {}", vmId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Sesión no válida"));
            }

            Object result = sliceService.getVMToken(token, vmId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error al pausar la VM: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/vm/{vmId}/vnc")
    @ResponseBody
    public ResponseEntity<?> getVMVncUrl(
        @PathVariable Integer vmId, 
        @RequestParam String token,  
        HttpSession session
    ) {
        log.info("Recibida petición para obtener URL VNC de VM: {}", vmId);
        try {

            String tokenUser = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (tokenUser == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Sesión no válida"));
            }

            Object result = sliceService.getVMVncUrl(token, tokenUser, vmId, userId);
            log.info("Respuesta del service: {}", result);
            
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error al obtener URL VNC: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
                ));
        }
    }



}
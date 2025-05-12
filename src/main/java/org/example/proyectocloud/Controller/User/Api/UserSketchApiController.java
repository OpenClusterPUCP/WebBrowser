package org.example.proyectocloud.Controller.User.Api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Service.User.SketchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("User/api/sketch")
@Slf4j
public class UserSketchApiController {

    @Autowired
    private SketchService sketchService;

    // CONSTANTES:
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
    public ResponseEntity<?> listSketches(HttpSession session) {
        log.info("Recibida petición para listar sketches");
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

            Object result = sketchService.listSketches(token, userId);
            log.info("Respuesta del service: {}", result);
            
            // Extraer el contenido del resultado del service
            if (result instanceof Map) {
                Map<String, Object> resultMap = (Map<String, Object>) result;
                // El service devuelve un map con "content" que contiene los sketches
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "content", resultMap.get("content")
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "content", result
            ));

        } catch (Exception e) {
            log.error("Error al obtener los sketches: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
                ));
        }
    }

    @PostMapping("/create")
    @ResponseBody
    public ResponseEntity<?> createSketch(@RequestBody Map<String, Object> sketchData, HttpSession session) {
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Sesión no válida"));
            }
            System.out.println("sketchData: " + sketchData);

            Object result = sketchService.createSketch(token, sketchData, getUserIdFromSession(session));

            Map<String, Object> response = new HashMap<>();
            response.put("data", result);
            response.put("success", true);
            response.put("message", "Sketch creado correctamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return handleException(e, "Error al crear el sketch");
        }
    }

    @GetMapping("/{sketchId}")
    @ResponseBody
    public ResponseEntity<?> getSketch(@PathVariable Integer sketchId, HttpSession session) {
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Sesión no válida"));
            }

            Object sketch = sketchService.getSketch(token, sketchId, getUserIdFromSession(session));
            
            if (sketch == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("error", "Sketch no encontrado"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("data", sketch);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener el sketch: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Error al obtener el sketch: " + e.getMessage()));
        }
    }

    @PutMapping("/{sketchId}")
    @ResponseBody
    public ResponseEntity<?> updateSketch(
            @PathVariable Integer sketchId,
            @RequestBody Map<String, Object> sketchData,
            HttpSession session) {
        
        log.info("Recibida petición para actualizar sketch ID: {}", sketchId);
        log.debug("Datos recibidos: {}", sketchData);

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

            // Validar estructura básica de datos
            if (!sketchData.containsKey("name") || !sketchData.containsKey("topology_info")) {
                return ResponseEntity.badRequest()
                    .body(Map.of(
                        "status", "error",
                        "message", "Datos incompletos",
                        "details", "Se requiere name y topology_info"
                    ));
            }

            // Llamar al servicio para actualizar
            Object result = sketchService.updateSketch(token, sketchId, userId, sketchData);
            
            // Procesar respuesta del servicio
            if (result instanceof Map) {
                Map<String, Object> resultMap = (Map<String, Object>) result;
                if (resultMap.containsKey("error")) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                            "status", "error",
                            "message", resultMap.get("error")
                        ));
                }
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Sketch actualizado correctamente",
                "content", result
            ));

        } catch (Exception e) {
            return handleException(e, "Error al actualizar el sketch");
        }
    }

    @DeleteMapping("/{sketchId}")
    @ResponseBody
    public ResponseEntity<?> deleteSketch(@PathVariable Integer sketchId, HttpSession session) {
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Sesión no válida"));
            }

            Object result = sketchService.deleteSketch(token, sketchId, getUserIdFromSession(session));

            Map<String, Object> response = new HashMap<>();
            response.put("data", result);
            response.put("success", true);
            response.put("message", "Sketch eliminado correctamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al eliminar el sketch: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Error al eliminar el sketch: " + e.getMessage()));
        }
    }

    @GetMapping("/resources/flavors")
    @ResponseBody
    public ResponseEntity<?> getFlavors(HttpSession session) {
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Sesión no válida"));
            }

            Map<String, Object> result = sketchService.getFlavors(token, userId);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "content", result.get("data")
            ));
        } catch (Exception e) {
            log.error("Error al obtener flavors: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "status", "error",
                    "message", "Error al obtener flavors: " + e.getMessage()
                ));
        }
    }

    @GetMapping("/resources/images")
    @ResponseBody
    public ResponseEntity<?> getImages(HttpSession session) {
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Sesión no válida"));
            }

            Map<String, Object> result = sketchService.getImages(token, userId);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "content", result.get("data")
            ));
        } catch (Exception e) {
            log.error("Error al obtener imágenes: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "status", "error",
                    "message", "Error al obtener imágenes: " + e.getMessage()
                ));
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
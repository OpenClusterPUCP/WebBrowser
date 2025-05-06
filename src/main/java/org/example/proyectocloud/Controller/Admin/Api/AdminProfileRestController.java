package org.example.proyectocloud.Controller.Admin.Api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Service.Admin.AdminProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST para operaciones de perfil de administrador
 * Maneja las peticiones AJAX desde la vista de perfil
 */
@RestController
@RequestMapping("/Admin/api/user")
@Slf4j
public class AdminProfileRestController {

    @Autowired
    private AdminProfileService adminProfileService;

    /**
     * Método auxiliar para obtener el token JWT de la sesión
     *
     * @param session Sesión HTTP
     * @return Token JWT o null si no se encuentra
     */
    private String getJwtTokenFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        if (userInfo != null && userInfo.getJwt() != null) {
            return userInfo.getJwt();
        }
        log.warn("No se pudo obtener el token JWT de la sesión");
        return null;
    }

    /**
     * Actualiza la información del perfil del usuario administrador
     */
    @PostMapping("/profile/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> profileData,
                                           HttpServletRequest request) {
        try {
            log.info("Petición de actualización de perfil recibida");
            HttpSession session = request.getSession(false);

            if (session == null) {
                log.warn("No hay sesión activa");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "No hay sesión activa"));
            }

            // Obtener UserInfo de la sesión
            UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
            if (userInfo == null) {
                log.warn("No hay información de usuario en la sesión");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "No hay información de usuario en la sesión"));
            }

            String username = userInfo.getUsername();
            Integer userId = userInfo.getId();

            // Verificar que el usuario autenticado coincide con el usuario a actualizar
            String requestUsername = (String) profileData.get("username");

            if (!username.equals(requestUsername)) {
                log.warn("Intento de actualizar perfil de otro usuario: {} vs {}", username, requestUsername);
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "No tiene permisos para actualizar este perfil"));
            }

            // Asegurarse de que el ID del usuario esté en los datos del perfil
            if (!profileData.containsKey("id") || profileData.get("id") == null) {
                log.debug("Añadiendo ID del usuario a los datos del perfil: {}", userId);
                profileData.put("id", userId);
            } else {
                Integer requestUserId = (Integer) profileData.get("id");
                if (!userId.equals(requestUserId)) {
                    log.warn("Intento de actualizar perfil con ID diferente: {} vs {}", userId, requestUserId);
                    return ResponseEntity
                            .status(HttpStatus.FORBIDDEN)
                            .body(Map.of("success", false, "message", "No tiene permisos para actualizar este perfil"));
                }
            }

            // Obtener el token JWT
            String token = userInfo.getJwt();
            if (token == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "No se pudo obtener el token de autenticación"));
            }

            // Actualizar perfil a través del servicio
            Map<String, Object> result = adminProfileService.updateProfile(profileData, token);

            // Verificar resultado
            if (result.containsKey("status") && ((Integer) result.get("status")) != 200) {
                log.error("Error al actualizar perfil: {}", result);
                return ResponseEntity
                        .status((Integer) result.get("status"))
                        .body(Map.of("success", false, "message", result.get("message")));
            }

            // Actualizar información en la sesión si es necesario
            if (result.containsKey("username")) {
                userInfo.setUsername((String) result.get("username"));
            }
            if (result.containsKey("name")) {
                userInfo.setName((String) result.get("name"));
            }
            if (result.containsKey("lastname")) {
                userInfo.setLastname((String) result.get("lastname"));
            }

            // Guardar UserInfo actualizado en la sesión
            session.setAttribute("userInfo", userInfo);

            log.info("Perfil actualizado correctamente para el usuario: {}", username);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Perfil actualizado correctamente",
                    "data", result
            ));

        } catch (Exception e) {
            log.error("Error inesperado al actualizar perfil: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error inesperado: " + e.getMessage()));
        }
    }

    /**
     * Cambia la contraseña del usuario administrador
     *
     * @param passwordData Datos para el cambio de contraseña
     * @param request Petición HTTP
     * @return Respuesta con el resultado de la operación
     */
    @PostMapping("/password/change")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, Object> passwordData,
                                            HttpServletRequest request) {
        try {
            log.info("Petición de cambio de contraseña recibida");
            HttpSession session = request.getSession(false);

            if (session == null) {
                log.warn("No hay sesión activa");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "No hay sesión activa"));
            }

            // Obtener UserInfo de la sesión
            UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
            if (userInfo == null) {
                log.warn("No hay información de usuario en la sesión");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "No hay información de usuario en la sesión"));
            }

            String username = userInfo.getUsername();

            // Añadir username a los datos de la petición
            passwordData.put("username", username);

            // Obtener el token JWT
            String token = userInfo.getJwt();
            if (token == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "No se pudo obtener el token de autenticación"));
            }

            // Cambiar contraseña a través del servicio
            Map<String, Object> result = adminProfileService.changePassword(passwordData, token);

            // Verificar resultado
            if (result.containsKey("status") && ((Integer) result.get("status")) != 200) {
                // Si la contraseña actual es incorrecta
                if (((Integer) result.get("status")) == 401) {
                    log.warn("Contraseña actual incorrecta para el usuario: {}", username);
                    return ResponseEntity
                            .status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("success", false, "message", "La contraseña actual es incorrecta"));
                }

                log.error("Error al cambiar contraseña: {}", result);
                return ResponseEntity
                        .status((Integer) result.get("status"))
                        .body(Map.of("success", false, "message", result.get("message")));
            }

            log.info("Contraseña cambiada correctamente para el usuario: {}", username);
            return ResponseEntity.ok(Map.of("success", true, "message", "Contraseña actualizada correctamente"));

        } catch (Exception e) {
            log.error("Error inesperado al cambiar contraseña: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error inesperado: " + e.getMessage()));
        }
    }

    /**
     * Obtiene las métricas de actividad del administrador
     *
     * @param userId ID del usuario administrador
     * @param request Petición HTTP
     * @return Respuesta con las métricas del administrador
     */
    @GetMapping("/metrics/{userId}")
    public ResponseEntity<?> getAdminMetrics(@PathVariable Integer userId,
                                             HttpServletRequest request) {
        try {
            log.info("Petición de métricas de administrador recibida para ID: {}", userId);
            HttpSession session = request.getSession(false);

            if (session == null) {
                log.warn("No hay sesión activa");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "No hay sesión activa"));
            }

            // Obtener UserInfo de la sesión
            UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
            if (userInfo == null) {
                log.warn("No hay información de usuario en la sesión");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "No hay información de usuario en la sesión"));
            }

            // Verificar que el usuario está solicitando sus propias métricas
            if (!userInfo.getId().equals(userId) && !"Admin".equals(userInfo.getRole())) {
                log.warn("Intento de acceder a métricas de otro usuario: {} vs {}", userInfo.getId(), userId);
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "No tiene permisos para ver estas métricas"));
            }

            // Obtener el token JWT
            String token = userInfo.getJwt();
            if (token == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "No se pudo obtener el token de autenticación"));
            }

            // Obtener métricas a través del servicio
            Map<String, Object> result = adminProfileService.getAdminMetrics(userId, token);

            // Verificar resultado
            if (result.containsKey("status") && ((Integer) result.get("status")) != 200) {
                log.error("Error al obtener métricas: {}", result);
                return ResponseEntity
                        .status((Integer) result.get("status"))
                        .body(Map.of("success", false, "message", result.get("message")));
            }

            log.info("Métricas obtenidas correctamente para el usuario ID: {}", userId);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error inesperado al obtener métricas: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error inesperado: " + e.getMessage()));
        }
    }
}
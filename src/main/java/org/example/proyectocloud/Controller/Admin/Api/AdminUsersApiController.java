package org.example.proyectocloud.Controller.Admin.Api;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;

import org.example.proyectocloud.Service.Admin.AdminUsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para operaciones CRUD de usuarios en el panel de administración.
 * Proporciona endpoints para crear, leer, actualizar y eliminar usuarios,
 * así como funciones especiales como banear/desbanear usuarios.
 */
@RestController
@RequestMapping("/Admin/api/users")
@Slf4j
public class AdminUsersApiController {
    

    @Autowired
    private AdminUsersService adminUsersService;

    /**
     * Método auxiliar para validar la sesión del usuario.
     * Verifica que exista una sesión activa con un token JWT válido.
     *
     * @param session Sesión HTTP del usuario
     * @return Información del usuario autenticado
     * @throws ResponseStatusException Si no hay sesión activa o token JWT
     */
    private UserInfo validateSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        if (userInfo == null || userInfo.getJwt() == null) {
            log.warn("Intento de acceso sin autenticación a API de usuarios");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No hay sesión activa");
        }
        return userInfo;
    }

    /**
     * Obtiene todos los usuarios del sistema.
     *
     * @param session Sesión HTTP para obtener el token JWT
     * @return Lista de usuarios con sus datos básicos
     */
    @GetMapping("")
    public ResponseEntity<?> getAllUsers(HttpSession session) {
        try {
            log.info("API: Solicitando listado de todos los usuarios");
            UserInfo userInfo = validateSession(session);
            List<UserDTO> users = adminUsersService.getAllUsers(userInfo.getJwt());

            // Convertir estado si es necesario
            users.forEach(user -> {
                if ("1".equals(user.getState())) {
                    user.setState("active");
                } else if ("0".equals(user.getState())) {
                    user.setState("banned");
                }
            });

            log.debug("Se obtuvieron {} usuarios", users.size());
            return ResponseEntity.ok(users);
        } catch (ResponseStatusException e) {
            log.error("Error de autorización al obtener usuarios: {}", e.getReason());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Collections.singletonMap("error", e.getReason()));
        } catch (Exception e) {
            log.error("Error al obtener usuarios", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al obtener usuarios: " + e.getMessage()));
        }
    }

    /**
     * Obtiene la información detallada de un usuario específico.
     *
     * @param id ID del usuario a consultar
     * @param session Sesión HTTP para obtener el token JWT
     * @return Datos del usuario solicitado
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Integer id, HttpSession session) {
        try {
            log.info("API: Solicitando información del usuario ID: {}", id);
            UserInfo userInfo = validateSession(session);
            UserDTO user = adminUsersService.getUserById(id, userInfo.getJwt());

            if (user == null) {
                log.warn("No se encontró el usuario con ID: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Usuario no encontrado"));
            }

            // Convertir estado si es necesario
            if ("1".equals(user.getState())) {
                user.setState("active");
            } else if ("0".equals(user.getState())) {
                user.setState("banned");
            }

            log.debug("Usuario ID {} encontrado: {}", id, user.getUsername());
            return ResponseEntity.ok(user);
        } catch (ResponseStatusException e) {
            log.error("Error de autorización al obtener usuario {}: {}", id, e.getReason());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Collections.singletonMap("error", e.getReason()));
        } catch (Exception e) {
            log.error("Error al obtener usuario ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al obtener usuario: " + e.getMessage()));
        }
    }

    /**
     * Crea un nuevo usuario en el sistema.
     *
     * @param userDTO Datos del nuevo usuario
     * @param session Sesión HTTP para obtener el token JWT
     * @return Datos del usuario creado
     */
    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody UserDTO userDTO, HttpSession session) {
        try {
            log.info("API: Creando nuevo usuario: {}", userDTO.getUsername());
            UserInfo userInfo = validateSession(session);

            // Convertir estado de UI a backend si es necesario
            if ("active".equals(userDTO.getState())) {
                userDTO.setState("1");
            } else if ("banned".equals(userDTO.getState())) {
                userDTO.setState("0");
            }

            // Verificar si se debe generar contraseña automáticamente
            if (userDTO.getPassword() == null || userDTO.getPassword().isEmpty()) {
                userDTO.setGeneratePassword(true);
                log.info("Configurando generación automática de contraseña para usuario: {}", userDTO.getUsername());
            }

            Object result = adminUsersService.createUser(userDTO, userInfo.getJwt());
            log.info("Usuario creado exitosamente: {}", userDTO.getUsername());
            return ResponseEntity.ok(result);
        } catch (ResponseStatusException e) {
            log.error("Error de autorización al crear usuario: {}", e.getReason());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Collections.singletonMap("error", e.getReason()));
        } catch (Exception e) {
            log.error("Error al crear usuario: " + userDTO.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al crear usuario: " + e.getMessage()));
        }
    }

    /**
     * Actualiza los datos de un usuario existente.
     *
     * @param id ID del usuario a actualizar
     * @param userDTO Nuevos datos del usuario
     * @param session Sesión HTTP para obtener el token JWT
     * @return Resultado de la actualización
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody UserDTO userDTO, HttpSession session) {
        try {
            log.info("API: Actualizando usuario ID: {}", id);
            UserInfo userInfo = validateSession(session);

            // Asegurar que el ID de la ruta coincida con el del DTO
            userDTO.setId(id);

            // Convertir estado de UI a backend si es necesario
            if ("active".equals(userDTO.getState())) {
                userDTO.setState("1");
            } else if ("banned".equals(userDTO.getState())) {
                userDTO.setState("0");
            }

            Map<String, Object> result = adminUsersService.updateUser(userDTO, userInfo.getJwt());
            log.info("Usuario ID {} actualizado exitosamente", id);
            return ResponseEntity.ok(result);
        } catch (ResponseStatusException e) {
            log.error("Error de autorización al actualizar usuario {}: {}", id, e.getReason());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Collections.singletonMap("error", e.getReason()));
        } catch (Exception e) {
            log.error("Error al actualizar usuario ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al actualizar usuario: " + e.getMessage()));
        }
    }

    /**
     * Elimina un usuario del sistema.
     *
     * @param id ID del usuario a eliminar
     * @param session Sesión HTTP para obtener el token JWT
     * @return Resultado de la eliminación
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id, HttpSession session) {
        try {
            log.info("API: Eliminando usuario ID: {}", id);
            UserInfo userInfo = validateSession(session);
            Map<String, Object> result = adminUsersService.deleteUser(id, userInfo.getJwt());
            log.info("Usuario ID {} eliminado exitosamente", id);
            return ResponseEntity.ok(result);
        } catch (ResponseStatusException e) {
            log.error("Error de autorización al eliminar usuario {}: {}", id, e.getReason());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Collections.singletonMap("error", e.getReason()));
        } catch (Exception e) {
            log.error("Error al eliminar usuario ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al eliminar usuario: " + e.getMessage()));
        }
    }

    /**
     * Suspende (banea) a un usuario.
     *
     * @param id ID del usuario a banear
     * @param session Sesión HTTP para obtener el token JWT
     * @return Resultado de la operación
     */
    @PostMapping("/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable Integer id, HttpSession session) {
        try {
            log.info("API: Suspendiendo usuario ID: {}", id);
            UserInfo userInfo = validateSession(session);
            Map<String, Object> result = adminUsersService.banUser(id, userInfo.getJwt());

            // Convertir resultado a formato compatible con la UI
            if (result != null && result.containsKey("state") && "0".equals(result.get("state"))) {
                result.put("state", "banned");
            }

            log.info("Usuario ID {} suspendido exitosamente", id);
            return ResponseEntity.ok(result);
        } catch (ResponseStatusException e) {
            log.error("Error de autorización al suspender usuario {}: {}", id, e.getReason());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Collections.singletonMap("error", e.getReason()));
        } catch (Exception e) {
            log.error("Error al suspender usuario ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al banear usuario: " + e.getMessage()));
        }
    }

    /**
     * Restaura (desbanea) a un usuario suspendido.
     *
     * @param id ID del usuario a restaurar
     * @param session Sesión HTTP para obtener el token JWT
     * @return Resultado de la operación
     */
    @PostMapping("/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable Integer id, HttpSession session) {
        try {
            log.info("API: Reactivando usuario ID: {}", id);
            UserInfo userInfo = validateSession(session);
            Map<String, Object> result = adminUsersService.unbanUser(id, userInfo.getJwt());

            // Convertir resultado a formato compatible con la UI
            if (result != null && result.containsKey("state") && "1".equals(result.get("state"))) {
                result.put("state", "active");
            }

            log.info("Usuario ID {} reactivado exitosamente", id);
            return ResponseEntity.ok(result);
        } catch (ResponseStatusException e) {
            log.error("Error de autorización al reactivar usuario {}: {}", id, e.getReason());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Collections.singletonMap("error", e.getReason()));
        } catch (Exception e) {
            log.error("Error al reactivar usuario ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al restaurar usuario: " + e.getMessage()));
        }
    }

    /**
     * Obtiene los usuarios filtrados por rol.
     *
     * @param roleId ID del rol para filtrar
     * @param session Sesión HTTP para obtener el token JWT
     * @return Lista de usuarios con el rol especificado
     */
    @GetMapping("/role/{roleId}")
    public ResponseEntity<?> getUsersByRole(@PathVariable Integer roleId, HttpSession session) {
        try {
            log.info("API: Solicitando usuarios con rol ID: {}", roleId);
            UserInfo userInfo = validateSession(session);
            List<UserDTO> users = adminUsersService.getUsersByRole(roleId, userInfo.getJwt());

            // Convertir estado si es necesario
            users.forEach(user -> {
                if ("1".equals(user.getState())) {
                    user.setState("active");
                } else if ("0".equals(user.getState())) {
                    user.setState("banned");
                }
            });

            log.debug("Se encontraron {} usuarios con rol ID: {}", users.size(), roleId);
            return ResponseEntity.ok(users);
        } catch (ResponseStatusException e) {
            log.error("Error de autorización al obtener usuarios por rol {}: {}", roleId, e.getReason());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Collections.singletonMap("error", e.getReason()));
        } catch (Exception e) {
            log.error("Error al obtener usuarios por rol ID: " + roleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al obtener usuarios por rol: " + e.getMessage()));
        }
    }
}

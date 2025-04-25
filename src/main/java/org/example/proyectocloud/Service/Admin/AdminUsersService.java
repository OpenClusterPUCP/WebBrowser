package org.example.proyectocloud.Service.Admin;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio para operaciones de administración de usuarios.
 * Contiene funcionalidades exclusivas para administradores.
 */
@Service
@Slf4j
public class AdminUsersService {
    
    @Autowired
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();

    DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // URL base para el API Gateway
    private static final String API_GATEWAY_URL = "http://localhost:8090";

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
     * Obtiene la lista de todos los usuarios.
     *
     * @param token Token JWT para autenticación
     * @return Lista de usuarios o lista vacía en caso de error
     */
    public List<UserDTO> getAllUsers(String token) {
        log.info("Solicitando lista de todos los usuarios");
        String url = API_GATEWAY_URL + "/api/admin/users";

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            try {
                List<UserDTO> usersList = objectMapper.readValue(
                        response.getBody(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserDTO.class)
                );
                log.debug("Se recuperaron {} usuarios", usersList.size());

                return usersList;
            } catch (Exception e) {
                log.error("Error deserializando usuarios: {}", e.getMessage());
                return Collections.emptyList();
            }
        } catch (Exception ex) {
            log.error("Error al consumir API de usuarios: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Crea un nuevo usuario en el sistema.
     *
     * @param userDTO Datos del nuevo usuario
     * @param token Token JWT para autenticación
     * @return Objeto con la respuesta del servidor o un mapa con error
     */
    public Object createUser(UserDTO userDTO, String token) {
        log.info("Creando nuevo usuario: {}", userDTO.getUsername());
        String url = API_GATEWAY_URL + "/api/admin/users";

        HttpHeaders headers = createJsonAuthHeaders(token);

        // Crear el objeto Role con el ID seleccionado
        Map<String, Object> roleMap = new HashMap<>();
        roleMap.put("id", userDTO.getRoleId());

        // Crear el body de la petición
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("username", userDTO.getUsername());

        // Si se debe generar contraseña automáticamente
        if (userDTO.isGeneratePassword()) {
            requestBody.put("generatePassword", true);
        } else if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            requestBody.put("password", userDTO.getPassword());
        } else {
            // Si no hay contraseña y no se debe generar, usar valor por defecto
            requestBody.put("generatePassword", true);
            log.info("No se especificó contraseña ni generación automática, activando generación por defecto");
        }

        requestBody.put("code", userDTO.getCode());
        requestBody.put("role", roleMap);
        requestBody.put("state", userDTO.getState() != null ? userDTO.getState() : "1");
        requestBody.put("name", userDTO.getName());
        requestBody.put("lastname", userDTO.getLastname());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.info("Usuario creado exitosamente: {}", userDTO.getUsername());

            // Intentar extraer y mostrar la contraseña generada del resultado
            try {
                Map<String, Object> responseMap = objectMapper.readValue(
                        response.getBody(),
                        new TypeReference<Map<String, Object>>() {}
                );

                if (responseMap.containsKey("generatedPassword")) {
                    log.info("Contraseña generada para el usuario {}: {}",
                            userDTO.getUsername(), responseMap.get("generatedPassword"));
                }

                return responseMap;
            } catch (Exception e) {
                log.warn("No se pudo deserializar la respuesta, retornando respuesta en crudo");
                return response.getBody();
            }
        } catch (Exception ex) {
            return handleError("Error al crear usuario", ex);
        }
    }

    /**
     * Obtiene información detallada de un usuario por su ID.
     *
     * @param userId ID del usuario a consultar
     * @param token Token JWT para autenticación
     * @return Objeto UserDTO con los datos del usuario o null si ocurre un error
     */
    public UserDTO getUserById(Integer userId, String token) {
        log.info("Obteniendo información del usuario ID: {}", userId);
        String url = API_GATEWAY_URL + "/api/admin/users/" + userId;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            try {
                Map<String, Object> userData = objectMapper.readValue(response.getBody(),
                        new TypeReference<Map<String, Object>>() {});

                UserDTO userDTO = new UserDTO();
                userDTO.setId((Integer) userData.get("id"));
                userDTO.setUsername((String) userData.get("username"));
                userDTO.setName((String) userData.get("name"));
                userDTO.setLastname((String) userData.get("lastname"));
                userDTO.setCode((String) userData.get("code"));
                userDTO.setRole((String) userData.get("role"));
                userDTO.setRoleId((Integer) userData.get("roleId"));
                userDTO.setState((String) userData.get("state"));
                userDTO.setCreatedAt((String) userData.get("createdAt"));
                userDTO.setLastLogin((String) userData.get("lastLogin"));

                log.debug("Usuario ID {} recuperado: {}", userId, userDTO.getUsername());
                return userDTO;
            } catch (Exception e) {
                log.error("Error deserializando usuario ID {}: {}", userId, e.getMessage());
                return null;
            }
        } catch (Exception ex) {
            log.error("Error al obtener usuario ID {}: {}", userId, ex.getMessage());
            return null;
        }
    }

    /**
     * Elimina un usuario del sistema.
     *
     * @param userId ID del usuario a eliminar
     * @param token Token JWT para autenticación
     * @return Mapa con el resultado de la operación
     */
    public Map<String, Object> deleteUser(Integer userId, String token) {
        log.info("Eliminando usuario ID: {}", userId);
        String url = API_GATEWAY_URL + "/api/admin/users/" + userId;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    entity,
                    String.class
            );

            log.info("Usuario ID {} eliminado exitosamente", userId);
            return processMapResponse(response.getBody());
        } catch (HttpClientErrorException ex) {
            log.error("Error del cliente HTTP al eliminar usuario ID {}: {}", userId, ex.getStatusCode());
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error al eliminar usuario");
            error.put("details", ex.getResponseBodyAsString());
            return error;
        } catch (Exception ex) {
            return handleError("Error inesperado al eliminar usuario", ex);
        }
    }

    /**
     * Actualiza la información de un usuario existente.
     *
     * @param userDTO Datos actualizados del usuario
     * @param token Token JWT para autenticación
     * @return Mapa con el resultado de la operación
     */
    public Map<String, Object> updateUser(UserDTO userDTO, String token) {
        log.info("Actualizando usuario ID: {}", userDTO.getId());
        String url = API_GATEWAY_URL + "/api/admin/users/" + userDTO.getId();

        HttpHeaders headers = createJsonAuthHeaders(token);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("username", userDTO.getUsername());
        requestBody.put("name", userDTO.getName());
        requestBody.put("lastname", userDTO.getLastname());
        requestBody.put("code", userDTO.getCode());

        // Incluir estado si está presente
        if (userDTO.getState() != null) {
            requestBody.put("state", userDTO.getState());
        }

        // Solo incluir password si no está vacío
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            requestBody.put("password", userDTO.getPassword());
            log.debug("Se incluye actualización de contraseña para usuario ID: {}", userDTO.getId());
        }

        // Solo incluir role si el roleId existe
        if (userDTO.getRoleId() != null) {
            Map<String, Object> roleMap = new HashMap<>();
            roleMap.put("id", userDTO.getRoleId());
            requestBody.put("role", roleMap);
            log.debug("Se incluye actualización de rol para usuario ID: {}", userDTO.getId());
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    String.class
            );

            log.info("Usuario ID {} actualizado exitosamente", userDTO.getId());
            return processMapResponse(response.getBody());
        } catch (HttpClientErrorException ex) {
            log.error("Error del cliente HTTP al actualizar usuario ID {}: {}", userDTO.getId(), ex.getStatusCode());
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error al actualizar usuario");
            error.put("details", ex.getResponseBodyAsString());
            return error;
        } catch (Exception ex) {
            return handleError("Error inesperado al actualizar usuario", ex);
        }
    }

    /**
     * Suspende (banea) a un usuario en el sistema.
     *
     * @param userId ID del usuario a banear
     * @param token Token JWT para autenticación
     * @return Mapa con el resultado de la operación
     */
    public Map<String, Object> banUser(Integer userId, String token) {
        log.info("Suspendiendo usuario ID: {}", userId);
        String url = API_GATEWAY_URL + "/api/admin/users/" + userId + "/ban";

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    String.class
            );

            log.info("Usuario ID {} suspendido exitosamente", userId);
            return processMapResponse(response.getBody());
        } catch (HttpClientErrorException ex) {
            log.error("Error del cliente HTTP al suspender usuario ID {}: {}", userId, ex.getStatusCode());
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error al banear usuario");
            error.put("details", ex.getResponseBodyAsString());
            return error;
        } catch (Exception ex) {
            return handleError("Error inesperado al banear usuario", ex);
        }
    }

    /**
     * Restaura (desbanea) a un usuario en el sistema.
     *
     * @param userId ID del usuario a desbanear
     * @param token Token JWT para autenticación
     * @return Mapa con el resultado de la operación
     */
    public Map<String, Object> unbanUser(Integer userId, String token) {
        log.info("Reactivando usuario ID: {}", userId);
        String url = API_GATEWAY_URL + "/api/admin/users/" + userId + "/unban";

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    String.class
            );

            log.info("Usuario ID {} reactivado exitosamente", userId);
            return processMapResponse(response.getBody());
        } catch (HttpClientErrorException ex) {
            log.error("Error del cliente HTTP al reactivar usuario ID {}: {}", userId, ex.getStatusCode());
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error al desbanear usuario");
            error.put("details", ex.getResponseBodyAsString());
            return error;
        } catch (Exception ex) {
            return handleError("Error inesperado al desbanear usuario", ex);
        }
    }

    /**
     * Obtiene usuarios filtrados por rol.
     *
     * @param roleId ID del rol para filtrar
     * @param token Token JWT para autenticación
     * @return Lista de usuarios con el rol especificado
     */
    public List<UserDTO> getUsersByRole(Integer roleId, String token) {
        log.info("Obteniendo usuarios con rol ID: {}", roleId);
        String url = API_GATEWAY_URL + "/api/admin/users/role/" + roleId;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            try {
                List<UserDTO> usersList = objectMapper.readValue(
                        response.getBody(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserDTO.class)
                );
                log.debug("Se encontraron {} usuarios con rol ID: {}", usersList.size(), roleId);
                return usersList;
            } catch (Exception e) {
                log.error("Error deserializando usuarios por rol: {}", e.getMessage());
                return Collections.emptyList();
            }
        } catch (Exception ex) {
            log.error("Error al obtener usuarios por rol: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }
}

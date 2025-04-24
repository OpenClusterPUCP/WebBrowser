package org.example.proyectocloud.Service.User;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio para operaciones de usuarios regulares.
 * Contiene funcionalidades disponibles para usuarios no administradores.
 */
@Service
@Slf4j
public class RegularUsersService {

    @Autowired
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();

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
     * Obtiene la lista de usuarios disponible para un usuario regular.
     * Esta versión proporciona información limitada comparada con la versión de administrador.
     *
     * @param token Token JWT para autenticación
     * @return Lista de usuarios o lista vacía en caso de error
     */
    public List<UserDTO> getUsersList(String token) {
        log.info("Obteniendo lista de usuarios (vista usuario regular)");
        String url = API_GATEWAY_URL + "/api/users";

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

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
                log.debug("Se recuperaron {} usuarios (vista usuario regular)", usersList.size());
                return usersList;
            } catch (Exception e) {
                log.error("Error deserializando lista de usuarios: {}", e.getMessage());
                return Collections.emptyList();
            }
        } catch (Exception ex) {
            log.error("Error al obtener lista de usuarios: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Obtiene el perfil del usuario actual.
     *
     * @param token Token JWT para autenticación
     * @return Datos del perfil de usuario o null si ocurre un error
     */
    public UserDTO getCurrentUserProfile(String token) {
        log.info("Obteniendo perfil del usuario actual");
        String url = API_GATEWAY_URL + "/api/users/profile";

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

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

                log.debug("Perfil de usuario recuperado: {}", userDTO.getUsername());
                return userDTO;
            } catch (Exception e) {
                log.error("Error deserializando perfil de usuario: {}", e.getMessage());
                return null;
            }
        } catch (Exception ex) {
            log.error("Error al obtener perfil de usuario: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Actualiza el perfil del usuario actual (información básica, no privilegios).
     *
     * @param userDTO Datos actualizados del perfil
     * @param token Token JWT para autenticación
     * @return Mapa con el resultado de la operación
     */
    public Map<String, Object> updateProfile(UserDTO userDTO, String token) {
        log.info("Actualizando perfil del usuario: {}", userDTO.getUsername());
        String url = API_GATEWAY_URL + "/api/users/profile";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("name", userDTO.getName());
        requestBody.put("lastname", userDTO.getLastname());

        // Solo incluir password si no está vacío
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            requestBody.put("password", userDTO.getPassword());
            log.debug("Se incluye actualización de contraseña para el perfil");
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    String.class
            );

            log.info("Perfil de usuario actualizado exitosamente: {}", userDTO.getUsername());
            try {
                return objectMapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.error("Error procesando respuesta de actualización de perfil: {}", e.getMessage());
                Map<String, Object> error = new HashMap<>();
                error.put("status", 500);
                error.put("message", "Error al procesar la respuesta");
                error.put("details", e.getMessage());
                return error;
            }
        } catch (Exception ex) {
            log.error("Error al actualizar perfil: {}", ex.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("status", 500);
            error.put("message", "Error al actualizar perfil");
            error.put("details", ex.getMessage());
            return error;
        }
    }
}

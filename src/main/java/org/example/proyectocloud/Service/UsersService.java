package org.example.proyectocloud.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.example.proyectocloud.Dao.AuthDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class UsersService {
    @Autowired
    private AuthDao authDao;

    @Autowired
    private RestTemplate restTemplate;

    private boolean autenticado = false;

    private ObjectMapper objectMapper = new ObjectMapper();

    // URL base para el API Gateway
    private static final String API_GATEWAY_URL = "http://localhost:8090";

    /**
     * Método para obtener la lista de todos los usuarios (como administrador)
     */
    public List<UserDTO> getAllUsers(String token) {
        String url = API_GATEWAY_URL + "/api/admin/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            List<UserDTO> usersList = new ArrayList<>();
            try {
                usersList = objectMapper.readValue(
                        response.getBody(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserDTO.class)
                );
                return usersList;
            } catch (Exception e) {
                System.err.println("Error deserializando usuarios: " + e.getMessage());
                return Collections.emptyList();
            }
        } catch (Exception ex) {
            System.err.println("Error al consumir API: " + ex.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Método para crear un nuevo usuario
     */
    public Object createUser(UserDTO userDTO, String token) {
        String url = API_GATEWAY_URL + "/api/admin/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Crear el objeto Role con el ID seleccionado
        Map<String, Object> roleMap = new HashMap<>();
        roleMap.put("id", userDTO.getRoleId());

        // Crear el body de la petición
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("username", userDTO.getUsername());
        requestBody.put("password", userDTO.getPassword());
        requestBody.put("code", userDTO.getCode());
        requestBody.put("role", roleMap);
        requestBody.put("state", "1");
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

            try {
                return objectMapper.readValue(response.getBody(), Object.class);
            } catch (Exception e) {
                return response.getBody();
            }
        } catch (Exception ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", 500);
            error.put("message", "Error inesperado");
            error.put("details", ex.getMessage());
            return error;
        }
    }

    /**
     * Obtiene un usuario por su ID
     */
    public UserDTO getUserById(Integer userId, String token) {
        String url = API_GATEWAY_URL + "/api/admin/users/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
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
                userDTO.setRoleId((Integer) userData.get("roleId"));
                userDTO.setState((String) userData.get("state"));

                return userDTO;
            } catch (Exception e) {
                System.err.println("Error deserializando usuario: " + e.getMessage());
                return null;
            }
        } catch (Exception ex) {
            System.err.println("Error al obtener usuario: " + ex.getMessage());
            return null;
        }
    }

    /**
     * Elimina un usuario por su ID
     */
    public Map<String, Object> deleteUser(Integer userId, String token) {
        String url = API_GATEWAY_URL + "/api/admin/users/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    entity,
                    String.class
            );

            try {
                return objectMapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                Map<String, Object> error = new HashMap<>();
                error.put("status", 500);
                error.put("message", "Error al procesar la respuesta");
                error.put("details", e.getMessage());
                return error;
            }
        } catch (HttpClientErrorException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error al eliminar usuario");
            error.put("details", ex.getResponseBodyAsString());
            return error;
        } catch (Exception ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", 500);
            error.put("message", "Error inesperado al eliminar usuario");
            error.put("details", ex.getMessage());
            return error;
        }
    }

    /**
     * Actualiza un usuario existente
     */
    public Map<String, Object> updateUser(UserDTO userDTO, String token) {
        String url = API_GATEWAY_URL + "/api/admin/users/" + userDTO.getId();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("username", userDTO.getUsername());
        requestBody.put("name", userDTO.getName());
        requestBody.put("lastname", userDTO.getLastname());
        requestBody.put("code", userDTO.getCode());

        // Solo incluir password si no está vacío
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            requestBody.put("password", userDTO.getPassword());
        }

        // Solo incluir role si el roleId existe
        if (userDTO.getRoleId() != null) {
            Map<String, Object> roleMap = new HashMap<>();
            roleMap.put("id", userDTO.getRoleId());
            requestBody.put("role", roleMap);
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    String.class
            );

            try {
                return objectMapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                Map<String, Object> error = new HashMap<>();
                error.put("status", 500);
                error.put("message", "Error al procesar la respuesta");
                error.put("details", e.getMessage());
                return error;
            }
        } catch (HttpClientErrorException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error al actualizar usuario");
            error.put("details", ex.getResponseBodyAsString());
            return error;
        } catch (Exception ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", 500);
            error.put("message", "Error inesperado al actualizar usuario");
            error.put("details", ex.getMessage());
            return error;
        }
    }

    /**
     * Banea a un usuario
     */
    public Map<String, Object> banUser(Integer userId, String token) {
        String url = API_GATEWAY_URL + "/api/admin/users/" + userId + "/ban";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    String.class
            );

            try {
                return objectMapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                Map<String, Object> error = new HashMap<>();
                error.put("status", 500);
                error.put("message", "Error al procesar la respuesta");
                error.put("details", e.getMessage());
                return error;
            }
        } catch (HttpClientErrorException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error al banear usuario");
            error.put("details", ex.getResponseBodyAsString());
            return error;
        } catch (Exception ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", 500);
            error.put("message", "Error inesperado al banear usuario");
            error.put("details", ex.getMessage());
            return error;
        }
    }

    /**
     * Desbanea a un usuario
     */
    public Map<String, Object> unbanUser(Integer userId, String token) {
        String url = API_GATEWAY_URL + "/api/admin/users/" + userId + "/unban";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    String.class
            );

            try {
                return objectMapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                Map<String, Object> error = new HashMap<>();
                error.put("status", 500);
                error.put("message", "Error al procesar la respuesta");
                error.put("details", e.getMessage());
                return error;
            }
        } catch (HttpClientErrorException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error al desbanear usuario");
            error.put("details", ex.getResponseBodyAsString());
            return error;
        } catch (Exception ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", 500);
            error.put("message", "Error inesperado al desbanear usuario");
            error.put("details", ex.getMessage());
            return error;
        }
    }

    /**
     * Obtiene usuarios por rol
     */
    public List<UserDTO> getUsersByRole(Integer roleId, String token) {
        String url = API_GATEWAY_URL + "/api/admin/users/role/" + roleId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            try {
                return objectMapper.readValue(
                        response.getBody(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserDTO.class)
                );
            } catch (Exception e) {
                System.err.println("Error deserializando usuarios por rol: " + e.getMessage());
                return Collections.emptyList();
            }
        } catch (Exception ex) {
            System.err.println("Error al obtener usuarios por rol: " + ex.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Obtener usuarios (para usuarios regulares)
     */
    public List<UserDTO> getUsersList(String token) {
        String url = API_GATEWAY_URL + "/api/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            try {
                return objectMapper.readValue(
                        response.getBody(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserDTO.class)
                );
            } catch (Exception e) {
                System.err.println("Error deserializando lista de usuarios: " + e.getMessage());
                return Collections.emptyList();
            }
        } catch (Exception ex) {
            System.err.println("Error al obtener lista de usuarios: " + ex.getMessage());
            return Collections.emptyList();
        }
    }
}
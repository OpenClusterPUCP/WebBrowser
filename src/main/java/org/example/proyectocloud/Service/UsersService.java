package org.example.proyectocloud.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.example.proyectocloud.Dao.AuthDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

@Service
public class UsersService {
    @Autowired
    private AuthDao authDao;

    @Autowired
    private RestTemplate restTemplate;

    private boolean autenticado = false;

    private ObjectMapper objectMapper = new ObjectMapper();

    public void consumirApiProtegidaA() {
        if (!autenticado) {
            authDao.autenticarYObtenerJwt("usuario", "clave");
            autenticado = true;
        }

        String url = "http://localhost:8090/listaUsuarios";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        System.out.println("Respuesta: " + response.getBody());
    }

    // Método para obtener usuarios
    public List<UserDTO> consumirApiProtegidaAdmin(String token) {
        // Ajustamos la URL según tu configuración de gateway
        String url = "http://localhost:8090/listaUsuarios";

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
                // Intentar deserializar como lista de usuarios
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

    // Método auxiliar para convertir valores a Integer
    private Integer convertToInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }


    // Método para crear usuario
    public Object createUser(UserDTO userDTO, String token) {
        // Usar la ruta correcta según tu configuración de gateway
        String url = "http://localhost:8090/createUser";

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

    // Método para suspender usuario
    public Object banUser(Integer userId, String token) {
        String url = "http://localhost:8090/banUser/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

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
            error.put("message", "Error al suspender usuario");
            error.put("details", ex.getMessage());
            return error;
        }
    }

    // Método para restaurar usuario
    public Object restoreUser(Integer userId, String token) {
        String url = "http://localhost:8090/restoreUser/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

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
            error.put("message", "Error al restaurar usuario");
            error.put("details", ex.getMessage());
            return error;
        }
    }




    public Object consumirApiProtegidaAlumno(String token) {
        String url = "http://localhost:8090/listaUsuarios";

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
            System.out.println("Respuesta exitosa: " + response.getBody());
            return response.getBody();

        } catch (HttpClientErrorException ex) {
            // Errores del lado del cliente: 400, 401, 403, etc.
            System.err.println("Error del cliente: " + ex.getStatusCode() + " - " + ex.getResponseBodyAsString());
            return "Error del cliente: " + ex.getStatusCode();

        } catch (HttpServerErrorException ex) {
            // Errores del servidor: 500, 502, 503, etc.
            System.err.println("Error del servidor: " + ex.getStatusCode() + " - " + ex.getResponseBodyAsString());
            return "Error del servidor: " + ex.getStatusCode();

        } catch (ResourceAccessException ex) {
            // Fallo de red o timeout
            System.err.println("Error de red o tiempo de espera: " + ex.getMessage());
            return "No se pudo conectar con el servidor";

        } catch (Exception ex) {
            // Otros errores no esperados
            System.err.println("Error inesperado: " + ex.getMessage());
            return "Ocurrió un error inesperado";
        }
    }
}

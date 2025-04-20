package org.example.proyectocloud.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.proyectocloud.Dao.AuthDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class UsersService {
    @Autowired
    private AuthDao authDao;

    @Autowired
    private RestTemplate restTemplate;

    private boolean autenticado = false;

    public void consumirApiProtegidaA() {
        if (!autenticado) {
            authDao.autenticarYObtenerJwt("usuario", "clave");
            autenticado = true;
        }

        String url = "http://localhost:8090/listaUsuarios";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        System.out.println("Respuesta: " + response.getBody());
    }

    public Object consumirApiProtegidaAdmin(String token) {
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

            // Intentar convertir la respuesta a JSON si viene en ese formato
            try {
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(response.getBody(), Object.class);
            } catch (Exception e) {
                // Si no se puede convertir, devolver el texto plano
                return response.getBody();
            }

        } catch (HttpClientErrorException ex) {
            // Errores del lado del cliente: 400, 401, 403, etc.
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error del cliente: " + ex.getStatusCode());
            error.put("details", ex.getResponseBodyAsString());
            return error;

        } catch (HttpServerErrorException ex) {
            // Errores del servidor: 500, 502, 503, etc.
            Map<String, Object> error = new HashMap<>();
            error.put("status", ex.getStatusCode().value());
            error.put("message", "Error del servidor: " + ex.getStatusCode());
            error.put("details", ex.getResponseBodyAsString());
            return error;

        } catch (ResourceAccessException ex) {
            // Fallo de red o timeout
            Map<String, Object> error = new HashMap<>();
            error.put("status", 503);
            error.put("message", "No se pudo conectar con el servidor");
            error.put("details", ex.getMessage());
            return error;

        } catch (Exception ex) {
            // Otros errores no esperados
            Map<String, Object> error = new HashMap<>();
            error.put("status", 500);
            error.put("message", "Ocurrió un error inesperado");
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

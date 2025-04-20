package org.example.proyectocloud.Dao;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.proyectocloud.DTO.JwtResponse;
import org.example.proyectocloud.DTO.LoginRequest;
import org.example.proyectocloud.DTO.TokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Component
public class AuthDao {
    @Autowired
    private ObjectMapper objectMapper;
    public String ipGateway ="localhost";

    public String portGateway = "8090";

    @Autowired
    private RestTemplate restTemplate;

    public Object autenticarYObtenerJwt(String username, String password) {
        String url = "http://" + ipGateway + ":" + portGateway + "/ayudenme";

        // Crear mapa para la solicitud en lugar de usar la clase LoginRequest
        LinkedHashMap<String, Object> requestMap = new LinkedHashMap<>();
        requestMap.put("username", username);
        requestMap.put("password", password);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<LinkedHashMap<String, Object>> entity = new HttpEntity<>(requestMap, headers);

        try {
            // Usar LinkedHashMap para recibir la respuesta en lugar de JwtResponse
            ResponseEntity<LinkedHashMap> response = restTemplate.postForEntity(url, entity, LinkedHashMap.class);
            return response;
        } catch (HttpClientErrorException.BadRequest e) {
            // Error 400: Solicitud incorrecta
            System.err.println("Solicitud incorrecta (400): " + e.getResponseBodyAsString());
            try {
                return new ResponseEntity<>(
                        objectMapper.readValue(e.getResponseBodyAsString(), LinkedHashMap.class),
                        HttpStatus.BAD_REQUEST
                );
            } catch (Exception ex) {
                LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Error en la solicitud");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }
        } catch (HttpClientErrorException.Unauthorized e) {
            // Error 401: No autorizado
            System.err.println("No autorizado (401): " + e.getResponseBodyAsString());
            try {
                return new ResponseEntity<>(
                        objectMapper.readValue(e.getResponseBodyAsString(), LinkedHashMap.class),
                        HttpStatus.UNAUTHORIZED
                );
            } catch (Exception ex) {
                LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Credenciales inválidas");
                return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
            }
        } catch (HttpClientErrorException.Forbidden e) {
            // Error 403: Prohibido
            System.err.println("Acceso prohibido (403): " + e.getResponseBodyAsString());
            try {
                return new ResponseEntity<>(
                        objectMapper.readValue(e.getResponseBodyAsString(), LinkedHashMap.class),
                        HttpStatus.FORBIDDEN
                );
            } catch (Exception ex) {
                LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Cuenta deshabilitada o bloqueada");
                return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
            }
        } catch (HttpServerErrorException.ServiceUnavailable e) {
            // Error 503: Servicio no disponible
            System.err.println("Servicio no disponible (503): " + e.getResponseBodyAsString());
            LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Servicio no disponible");
            return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
        } catch (HttpServerErrorException.InternalServerError e) {
            // Error 500: Error interno del servidor
            System.err.println("Error interno del servidor (500): " + e.getResponseBodyAsString());
            try {
                return new ResponseEntity<>(
                        objectMapper.readValue(e.getResponseBodyAsString(), LinkedHashMap.class),
                        HttpStatus.INTERNAL_SERVER_ERROR
                );
            } catch (Exception ex) {
                LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Error interno del servidor");
                return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (HttpStatusCodeException e) {
            // Manejo para otros errores HTTP no cubiertos específicamente
            System.err.println("Error HTTP " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
            try {
                return new ResponseEntity<>(
                        objectMapper.readValue(e.getResponseBodyAsString(), LinkedHashMap.class),
                        e.getStatusCode()
                );
            } catch (Exception ex) {
                LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Error HTTP: " + e.getStatusCode().value());
                return new ResponseEntity<>(errorResponse, e.getStatusCode());
            }
        } catch (ResourceAccessException e) {
            // Error de conexión (timeout, conexión rechazada, etc.)
            System.err.println("Error de conexión: " + e.getMessage());
            LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error de conexión al servicio");
            return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
        } catch (RestClientException e) {
            // Otros errores de cliente REST
            System.err.println("Error al conectar con el servicio: " + e.getMessage());
            LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error de comunicación con el servicio");
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}

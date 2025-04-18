package org.example.proyectocloud.Dao;

import org.example.proyectocloud.DTO.JwtResponse;
import org.example.proyectocloud.DTO.LoginRequest;
import org.example.proyectocloud.DTO.TokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Component
public class AuthDao {
    @Autowired
    private RestTemplate restTemplate;



    public String autenticarYObtenerJwt(String username, String password) {
        String url = "http://localhost:8090/ayudenme";//Apuntar al API-GATEWAY
        LoginRequest request = new LoginRequest(username, password);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<LoginRequest> entity = new HttpEntity<>(request, headers);
        try {
            ResponseEntity<JwtResponse> response = restTemplate.postForEntity(url, entity, JwtResponse.class);
            return response.getBody().getToken();
        } catch (HttpServerErrorException.ServiceUnavailable e) {
            // Manejo específico para error 503
            System.err.println("Servicio no disponible (503): " + e.getMessage());
            return "ERROR_SERVICIO_NO_DISPONIBLE";
        } catch (HttpStatusCodeException e) {
            // Manejo para otros errores HTTP
            System.err.println("Error HTTP " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
            return "ERROR_" + e.getStatusCode().value();
        } catch (RestClientException e) {
            // Manejo para otros errores de cliente REST (timeout, etc.)
            System.err.println("Error al conectar con el servicio: " + e.getMessage());
            return "ERROR_CONEXION";
        }
    }

}

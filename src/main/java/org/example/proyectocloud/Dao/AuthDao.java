package org.example.proyectocloud.Dao;

import org.example.proyectocloud.DTO.JwtResponse;
import org.example.proyectocloud.DTO.LoginRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

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
        String url = "http://localhost:8090/ayudenme"; // cambia el puerto si es necesario

        // Crear el body del request
        LoginRequest request = new LoginRequest(username, password);

        // Encabezados
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Request completo (body + headers)
        HttpEntity<LoginRequest> entity = new HttpEntity<>(request, headers);

        // Consumir el POST
        ResponseEntity<JwtResponse> response = restTemplate.postForEntity(
                url,
                entity,
                JwtResponse.class
        );

        // Devolver el token
        return response.getBody().getToken();
    }
}

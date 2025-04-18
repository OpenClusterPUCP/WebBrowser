package org.example.proyectocloud.Dao;

import org.example.proyectocloud.DTO.JwtResponse;
import org.example.proyectocloud.DTO.LoginRequest;
import org.example.proyectocloud.DTO.TokenProvider;
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

    @Autowired
    private TokenProvider tokenProvider;

    public String autenticarYObtenerJwt(String username, String password) {
        String url = "http://localhost:8090/ayudenme";
        LoginRequest request = new LoginRequest(username, password);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<LoginRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<JwtResponse> response = restTemplate.postForEntity(url, entity, JwtResponse.class);

        String token = response.getBody().getToken();
        tokenProvider.setToken(token); // Guardamos el token aquí

        return token;
    }

}

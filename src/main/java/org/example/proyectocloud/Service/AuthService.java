package org.example.proyectocloud.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;

@Service
public class AuthService {

    private final RestTemplate restTemplate;
    
    @Value("${auth.service.url}")
    private String authServiceUrl;
    
    public AuthService() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Authenticates a user by forwarding the login request to the authentication microservice
     * 
     * @param loginRequest The login request containing username and password
     * @return Response from authentication service (with JWT token if successful)
     */
    public LinkedHashMap<String, Object> authenticate(LinkedHashMap<String, Object> loginRequest) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<LinkedHashMap<String, Object>> request = new HttpEntity<>(loginRequest, headers);
            
            // Forward the request to the authentication microservice
            ResponseEntity<LinkedHashMap> response = restTemplate.postForEntity(
                authServiceUrl + "/login", 
                request, 
                LinkedHashMap.class
            );
            
            return response.getBody();
        } catch (Exception e) {
            // In case of connection errors, create an error response
            LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error connecting to authentication service: " + e.getMessage());
            return errorResponse;
        }
    }
}
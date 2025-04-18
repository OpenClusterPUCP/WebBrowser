package org.example.proyectocloud.DTO;

import org.springframework.stereotype.Component;

@Component
public class TokenProvider {
    private String jwtToken;

    public String getToken() {
        return jwtToken;
    }

    public void setToken(String token) {
        this.jwtToken = token;
    }
}
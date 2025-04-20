package org.example.proyectocloud.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.LinkedHashMap;

@Component
public class SecurityAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        
        // For API requests, return 401 with JSON
        if (request.getRequestURI().startsWith("/Admin/api") || request.getRequestURI().startsWith("/User/api") ) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            LinkedHashMap<String, Object> responseBody = new LinkedHashMap<>();
            responseBody.put("success", false);
            responseBody.put("message", "Unauthorized: Authentication required");
            
            response.getWriter().write(objectMapper.writeValueAsString(responseBody));
        } else {
            // For web requests, redirect to login page
            response.sendRedirect("/");
        }
    }
}
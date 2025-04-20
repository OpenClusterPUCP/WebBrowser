package org.example.proyectocloud.Filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.LinkedHashMap;

@Component
public class SecurityAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        
        // For API requests, return 403 with JSON
        if (request.getRequestURI().startsWith("/Admin/api")  || request.getRequestURI().startsWith("/User/api")) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            LinkedHashMap<String, Object> responseBody = new LinkedHashMap<>();
            responseBody.put("success", false);
            responseBody.put("message", "Forbidden: You don't have permission to access this resource");
            response.getWriter().write(objectMapper.writeValueAsString(responseBody));
        }else{
            // Establecer el código de estado 403
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);

            // Añadir atributos que necesite la vista
            request.setAttribute("status", HttpServletResponse.SC_FORBIDDEN);
            request.setAttribute("error", "Forbidden");
            request.setAttribute("message", "No tienes permiso para acceder a este recurso");
            RequestDispatcher dispatcher = request.getRequestDispatcher("/error-503");
            dispatcher.forward(request, response);
        }
    }
}
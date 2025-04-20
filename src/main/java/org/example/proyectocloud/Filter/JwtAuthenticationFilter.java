package org.example.proyectocloud.Filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.example.proyectocloud.Bean.UserInfo;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        HttpSession session = request.getSession(false);
        
        // Skip authentication for permitted URLs
        String requestURI = request.getRequestURI();
        if (requestURI.equals("/login") || requestURI.startsWith("/auth/") || 
            requestURI.startsWith("/error/") || requestURI.startsWith("/css/") || 
            requestURI.startsWith("/js/") || requestURI.startsWith("/images/")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        if (session != null) {
            try {
                // Retrieve JWT token and user info from session
                String token = ( (UserInfo) session.getAttribute("userInfo")).getJwt();
                String username = (  (UserInfo) session.getAttribute("userInfo")  ) .getUsername();
                String role = (  (UserInfo) session.getAttribute("userInfo")  ) .getRole();
                String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;


                if (token != null && username != null && role != null) {
                    List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(roleWithPrefix));
                    // Create authentication token
                    UsernamePasswordAuthenticationToken authToken = 
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                    
                    // Set authentication in context
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                // Clear context in case of errors
                SecurityContextHolder.clearContext();
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
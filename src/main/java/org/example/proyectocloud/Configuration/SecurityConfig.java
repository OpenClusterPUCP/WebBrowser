package org.example.proyectocloud.Configuration;

import org.example.proyectocloud.Component.SecurityAuthenticationEntryPoint;
import org.example.proyectocloud.Filter.JwtAuthenticationFilter;

import org.example.proyectocloud.Filter.SecurityAccessDeniedHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final SecurityAuthenticationEntryPoint authenticationEntryPoint;
    private final SecurityAccessDeniedHandler accessDeniedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(SecurityAuthenticationEntryPoint authenticationEntryPoint,
                          SecurityAccessDeniedHandler accessDeniedHandler,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin())
                        .xssProtection(xss -> xss.disable())
                        .contentSecurityPolicy(csp -> csp
                        .policyDirectives("frame-ancestors 'self' http://localhost:* https://localhost:*; " +
                                        "frame-src 'self' http://localhost:* https://localhost:*; "))
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.ALWAYS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .authorizeHttpRequests(authorize -> authorize
                        // WebSocket endpoint permitido sin autenticación
                        .requestMatchers(AntPathRequestMatcher.antMatcher("/User/api/vnc/vm/*/socket")).permitAll()
                        .requestMatchers(AntPathRequestMatcher.antMatcher("/ws/**")).permitAll()
                        // Rutas públicas para autenticación
                        .requestMatchers("/" , "/InicioSesion" , "/recuperarContraseña" , "/Logearse").permitAll()
                        .requestMatchers("/ResetPassword", "/password-reset", "/password-reset/confirm").permitAll()
                        // Permitir acceso a noVNC y recursos relacionados
                        .requestMatchers("/novnc/**", "/VNC/**").permitAll()
                        .requestMatchers("/css/material-dashboard.css").permitAll()
                        // Rutas protegidas por roles
                        .requestMatchers("/Admin/**" , "Admin/*").hasRole("Admin")
                        .requestMatchers("/User/**", "User/*").hasAnyRole("User")
                        .anyRequest().authenticated()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
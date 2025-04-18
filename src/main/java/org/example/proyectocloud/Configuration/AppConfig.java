package org.example.proyectocloud.Configuration;

import org.example.proyectocloud.DTO.TokenProvider;
import org.example.proyectocloud.Dao.AuthDao;
import org.example.proyectocloud.Implementation.JwtInterceptor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate(TokenProvider tokenProvider) {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.getInterceptors().add(new JwtInterceptor(tokenProvider));
        return restTemplate;
    }
}
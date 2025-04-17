package org.example.proyectocloud.Configuration;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {
    @Bean
    public RestTemplate clientRest(RestTemplateBuilder restTemplateBuilder){
        return  restTemplateBuilder.build();
    }


}
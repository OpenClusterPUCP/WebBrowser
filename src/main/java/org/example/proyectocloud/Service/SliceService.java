package org.example.proyectocloud.Service;

import jakarta.annotation.PostConstruct;
import org.example.proyectocloud.Dao.AuthDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SliceService {
    @Autowired
    private AuthDao authDao;

    @Autowired
    private RestTemplate restTemplate;

    private boolean autenticado = false;

    public void consumirApiProtegidaA() {
        if (!autenticado) {
            authDao.autenticarYObtenerJwt("usuario", "clave");
            autenticado = true;
        }

        String url = "http://localhost:8090/recurso-protegido";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        System.out.println("Respuesta: " + response.getBody());
    }

    public Object  consumirApiProtegida() {
        String url = "http://localhost:8090/recurso-protegido";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        System.out.println("Respuesta: " + response.getBody());
        return response.getBody();
    }
}

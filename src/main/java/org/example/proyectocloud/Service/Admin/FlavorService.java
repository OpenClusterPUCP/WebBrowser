package org.example.proyectocloud.Service.Admin;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.DTO.Admin.Flavors.FlavorRequest;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Service
public class FlavorService {
    private static final Logger log = LoggerFactory.getLogger(FlavorService.class);
    @Autowired
    private RestTemplate restTemplate;
    @Value("${api.gateway.url}")
    private String API_GATEWAY_URL;
    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        return headers;
    }
    public Object  getAllFlavors(String token , Integer id) {
        log.info("Solicitando lista de todos los flavors");
        String url = API_GATEWAY_URL + "/Admin/flavors/list/" +   id;

        HttpHeaders headers = createAuthHeaders(token);
        System.out.println(headers);
        System.out.println(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    LinkedHashMap.class
            );

            try {
                System.out.println(response.getBody());
                LinkedHashMap<String , Object> json  =   response.getBody();
                ArrayList<LinkedHashMap<String , Object>> lista = (ArrayList<LinkedHashMap<String , Object>>) json.get("content");

                log.debug("Se recuperaron {} flavors", lista.size());

                return lista;
            } catch (Exception e) {
                log.error("Error deserializando usuarios: {}", e.getMessage());
                return Collections.emptyList();
            }
        } catch (Exception ex) {
            log.error("Error al consumir API de usuarios: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }
    public Object  deleteFlavor(String token , Integer id) {
        log.info("Solicitando lista de todos los flavors");
        String url = API_GATEWAY_URL + "/Admin/flavors/delete/" +   id;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    entity,
                    LinkedHashMap.class
            );

            try {
                System.out.println(response.getBody());
                LinkedHashMap<String , Object> json  =   response.getBody();

                return json;
            } catch (Exception e) {
                log.error("Error deserializando usuarios: {}", e.getMessage());
                return Collections.emptyList();
            }
        } catch (Exception ex) {
            log.error("Error al consumir API de usuarios: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }
    public Object updateFlavor(String token, FlavorRequest flavor, Integer idFlavor , Integer idUser) {
        log.info("Actualizando flavor con ID: {}", idFlavor);
        String url = API_GATEWAY_URL + "/Admin/flavors/update/" + idFlavor ;

        // Obtener ID del usuario administrador actual desde el token o session
        Integer adminUserId = idUser; // Implementar este método según tu lógica

        // Añadir el parámetro adminUserId como query parameter
        url = url + "?idAdmin=" + adminUserId;

        HttpHeaders headers = createAuthHeaders(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // No es necesario crear un LinkedHashMap adicional, simplemente usamos el objeto FlavorRequest
        HttpEntity<FlavorRequest> entity = new HttpEntity<>(flavor, headers);

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    LinkedHashMap.class
            );

            try {
                System.out.println(response.getBody());
                LinkedHashMap<String, Object> json = response.getBody();
                return json;
            } catch (Exception e) {
                log.error("Error deserializando respuesta de actualización de flavor: {}", e.getMessage());
                return Collections.singletonMap("error", "Error al procesar la respuesta: " + e.getMessage());
            }
        } catch (HttpClientErrorException ex) {
            // Manejo de errores HTTP con información detallada
            log.error("Error al actualizar flavor: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            try {
                // Intentar extraer el mensaje de error del cuerpo de la respuesta
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> errorResponse = mapper.readValue(ex.getResponseBodyAsString(), Map.class);
                return errorResponse;
            } catch (Exception e) {
                return Collections.singletonMap("error", "Error al actualizar flavor: " + ex.getMessage());
            }
        } catch (Exception ex) {
            log.error("Error al consumir API de flavors: {}", ex.getMessage());
            return Collections.singletonMap("error", "Error al actualizar flavor: " + ex.getMessage());
        }
    }
    public Object createFlavor(String token, FlavorRequest flavor, Integer idFlavor , Integer idUser) {
        log.info("Actualizando flavor con ID: {}", idFlavor);
        String url = API_GATEWAY_URL + "/Admin/flavors/create";

        // Obtener ID del usuario administrador actual desde el token o session


        HttpHeaders headers = createAuthHeaders(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // No es necesario crear un LinkedHashMap adicional, simplemente usamos el objeto FlavorRequest

        HttpEntity<FlavorRequest> entity = new HttpEntity<>(flavor, headers);

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    LinkedHashMap.class
            );

            try {
                System.out.println(response.getBody());
                LinkedHashMap<String, Object> json = response.getBody();
                return json;
            } catch (Exception e) {
                log.error("Error deserializando respuesta de actualización de flavor: {}", e.getMessage());
                return Collections.singletonMap("error", "Error al procesar la respuesta: " + e.getMessage());
            }
        } catch (HttpClientErrorException ex) {
            // Manejo de errores HTTP con información detallada
            log.error("Error al actualizar flavor: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            try {
                // Intentar extraer el mensaje de error del cuerpo de la respuesta
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> errorResponse = mapper.readValue(ex.getResponseBodyAsString(), Map.class);
                return errorResponse;
            } catch (Exception e) {
                return Collections.singletonMap("error", "Error al actualizar flavor: " + ex.getMessage());
            }
        } catch (Exception ex) {
            log.error("Error al consumir API de flavors: {}", ex.getMessage());
            return Collections.singletonMap("error", "Error al actualizar flavor: " + ex.getMessage());
        }
    }

}

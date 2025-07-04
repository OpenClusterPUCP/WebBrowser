package org.example.proyectocloud.Service.User;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SecurityGroupService {
    private static final Logger log = LoggerFactory.getLogger(SecurityGroupService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${api.gateway.url}")
    private String API_GATEWAY_URL;

    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    // List Security Groups
    public Object listSecurityGroups(String token) {
        String url = API_GATEWAY_URL + "/security-module/list-security-groups";
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al listar security groups: {}", ex.getMessage());
            return errorResponse("error", "Error al listar security groups", ex.getMessage());
        }
    }

    // Create Security Group
    public Object createSecurityGroup(String token, Map<String, Object> body) {
        String url = API_GATEWAY_URL + "/security-module/create-security-group";
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.POST, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al crear security group: {}", ex.getMessage());
            return errorResponse("error", "Error al crear security group", ex.getMessage());
        }
    }

    // Get Security Group by ID
    public Object getSecurityGroup(String token, Integer sgId) {
        String url = API_GATEWAY_URL + "/security-module/get-security-group/" + sgId;
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al obtener security group: {}", ex.getMessage());
            return errorResponse("error", "Error al obtener security group", ex.getMessage());
        }
    }

    // Edit Security Group
    public Object editSecurityGroup(String token, Map<String, Object> body) {
        String url = API_GATEWAY_URL + "/security-module/edit-security-group";
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.PUT, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al editar security group: {}", ex.getMessage());
            return errorResponse("error", "Error al editar security group", ex.getMessage());
        }
    }

    // Delete Security Group
    public Object deleteSecurityGroup(String token, Integer sgId) {
        String url = API_GATEWAY_URL + "/security-module/delete-security-group/" + sgId;
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.DELETE, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al eliminar security group: {}", ex.getMessage());
            return errorResponse("error", "Error al eliminar security group", ex.getMessage());
        }
    }

    // Assign Security Group
    public Object assignSecurityGroup(String token, Map<String, Object> body) {
        String url = API_GATEWAY_URL + "/security-module/assign-security-group";
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.PUT, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al asignar security group: {}", ex.getMessage());
            return errorResponse("error", "Error al asignar security group", ex.getMessage());
        }
    }

    // Unassign Security Group
    public Object unassignSecurityGroup(String token, Map<String, Object> body) {
        String url = API_GATEWAY_URL + "/security-module/unassign-security-group";
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.PUT, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al desasignar security group: {}", ex.getMessage());
            return errorResponse("error", "Error al desasignar security group", ex.getMessage());
        }
    }

    // Get Security Group by Interface
    public Object getSecurityGroupByInterface(String token, Integer interfaceId) {
        String url = API_GATEWAY_URL + "/security-module/get-security-group-by-interface/" + interfaceId;
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al obtener SG por interfaz: {}", ex.getMessage());
            return errorResponse("error", "Error al obtener SG por interfaz", ex.getMessage());
        }
    }

    // Create Rule
    public Object createRule(String token, Map<String, Object> body) {
        String url = API_GATEWAY_URL + "/security-module/create-rule";
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.POST, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al crear regla: {}", ex.getMessage());
            return errorResponse("error", "Error al crear regla", ex.getMessage());
        }
    }

    // Delete Rule
    public Object deleteRule(String token, Integer ruleId) {
        String url = API_GATEWAY_URL + "/security-module/delete-rule/" + ruleId;
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.DELETE, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al eliminar regla: {}", ex.getMessage());
            return errorResponse("error", "Error al eliminar regla", ex.getMessage());
        }
    }

    // List Rules of a Security Group
    public Object listRules(String token, Integer sgId) {
        String url = API_GATEWAY_URL + "/security-module/list-rules/" + sgId;
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            // Capturar errores HTTP y devolver el cuerpo de la respuesta tal como está
            log.error("Error al crear regla: {}", ex.getMessage());
            return ex.getResponseBodyAsString();
        } catch (Exception ex) {
            log.error("Error al listar reglas: {}", ex.getMessage());
            return errorResponse("error", "Error al listar reglas", ex.getMessage());
        }
    }

    private Map<String, Object> errorResponse(String status, String message, String details) {
        return Map.of(
                "status", status,
                "message", message,
                "details", details
        );
    }
}
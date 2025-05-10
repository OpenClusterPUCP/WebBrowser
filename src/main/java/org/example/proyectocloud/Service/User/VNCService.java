package org.example.proyectocloud.Service.User;

import org.example.proyectocloud.Handler.VNCWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class VNCService {
    private static final Logger log = LoggerFactory.getLogger(VNCService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${api.gateway.url}")
    private String API_GATEWAY_URL;

    private HttpHeaders createAuthHeaders(String token) {
        log.debug("Creando headers con token: {}", token);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        log.debug("Headers creados: {}", headers);
        return headers;
    }

    public Object getVMToken(String token, Integer vmId, Integer userId) {
        try {
            String url = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL + "/slice-manager/vm-token/" + vmId)
            .queryParam("user_id", userId)
            .toUriString();
            
            HttpHeaders headers = createAuthHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                LinkedHashMap.class
            );
            
            return response.getBody();
        } catch (Exception ex) {
            log.error("Error al obtener token de VM: {}", ex.getMessage(), ex);
            throw ex;
        }
    }


    public void handleVNCSocket(Integer vmId, String token, String tokenUser, WebSocketSession clientSession) throws Exception {
        log.info("=== INICIANDO PROXY VNC PARA VM ID-{} ===", vmId);
        log.info("Token VNC recibido: {}", maskToken(token));
        log.info("Token Usuario recibido: {}", maskToken(tokenUser));
        
        String wsUrl = UriComponentsBuilder
            .fromUriString(API_GATEWAY_URL.replace("http", "ws"))
            .path("/slice-manager/vnc-socket/{vmId}")
            .queryParam("token", token)
            .buildAndExpand(vmId)
            .toUriString();
        
        log.info("Conectando a servidor VNC: {}", wsUrl);
        
        WebSocketClient webSocketClient = new StandardWebSocketClient();
        WebSocketHttpHeaders headers = new WebSocketHttpHeaders();
        
        log.info("Configurando headers de autenticación...");
        headers.add("Authorization", "Bearer " + tokenUser);
        
        log.info("Headers configurados: {}", headers.toSingleValueMap());
        
        try {
            WebSocketHandler serverHandler = new org.example.proyectocloud.Handler.VNCServerWebSocketHandler(clientSession);
            
            log.info("Iniciando handshake...");
            
            @SuppressWarnings("removal") 
            WebSocketSession serverSession = webSocketClient
                .doHandshake(serverHandler, headers, URI.create(wsUrl))
                .get(5, TimeUnit.SECONDS);
            
            log.info("Conexión establecida con slice-manager. Session ID: {}", serverSession.getId());
            
            clientSession.getAttributes().put("serverSession", serverSession);
            serverSession.getAttributes().put("clientSession", clientSession);
            
            log.info("Proxy VNC establecido exitosamente para VM ID-{}", vmId);
            
        } catch (Exception e) {
            log.error("Error estableciendo proxy VNC para VM ID-{}: {}", vmId, e.getMessage());
            log.info("Detalles completos del error:", e);
            if (clientSession.isOpen()) {
                log.info("Cerrando sesión cliente debido al error");
                clientSession.close(CloseStatus.SERVER_ERROR);
            }
            throw e;
        }
    }

    private String maskToken(String token) {
        if (token == null || token.length() < 10) return "***";
        return token.substring(0, 5) + "..." + token.substring(token.length() - 5);
    }
}
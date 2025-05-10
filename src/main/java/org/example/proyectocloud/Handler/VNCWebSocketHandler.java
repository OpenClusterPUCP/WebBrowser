package org.example.proyectocloud.Handler;

import jakarta.annotation.PostConstruct;
import org.example.proyectocloud.Service.User.VNCService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;

@Component
public class VNCWebSocketHandler implements WebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(VNCWebSocketHandler.class);


    @Autowired
    private VNCService vncService;

    private static final String SESSION_TOKEN_KEY = "userInfo";
    private static final String SESSION_USER_ID_KEY = "userInfo";

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("Nueva conexión WebSocket establecida: {}", session.getId());
        
        // Extraer vmId de la URI
        String path = session.getUri().getPath();
        String vmIdStr = path.substring(path.lastIndexOf('/') - 2, path.lastIndexOf('/'));
        Integer vmId = Integer.parseInt(vmIdStr);
        
        log.info("=== SOCKET VNC CONSOLE VM ID-{} ===", vmId);
        
        try {
            // Obtener token de VNC de query params
            String vncToken = null;
            String query = session.getUri().getQuery();
            
            if (query != null && query.contains("token=")) {
                vncToken = query.split("token=")[1];
                if (vncToken.contains("&")) {
                    vncToken = vncToken.split("&")[0];
                }
            }
                
            if (vncToken == null || vncToken.isEmpty()) {
                log.warn("Token VNC inválido o expirado para VM ID-{}", vmId);
                session.sendMessage(new TextMessage("Acceso denegado: Token VNC inválido o expirado"));
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            // Obtener token de autenticación del handshake
            Map<String, Object> attributes = session.getAttributes();
            String authToken = (String) attributes.get("jwt");
            
            if (authToken == null || authToken.isEmpty()) {
                log.warn("Token de autenticación no encontrado para VM ID-{}", vmId);
                session.sendMessage(new TextMessage("Acceso denegado: Token de autenticación no encontrado"));
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            log.debug("Token VNC recibido: {}", vncToken);
            log.debug("Token de autenticación recibido: {}", authToken);
            
            vncService.handleVNCSocket(vmId, vncToken, authToken, session);
            
        } catch (Exception e) {
            log.error("Error en proxy VNC: {}", e.getMessage());
            try {
                session.sendMessage(new TextMessage("Error interno: " + e.getMessage()));
                session.close(CloseStatus.SERVER_ERROR);
            } catch (IOException ex) {
                log.error("Error cerrando WebSocket: {}", ex.getMessage());
            }
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        WebSocketSession targetSession = null;
        
        // Determinar la sesión destino
        if (session.getAttributes().containsKey("clientSession")) {
            targetSession = (WebSocketSession) session.getAttributes().get("clientSession");
        } else if (session.getAttributes().containsKey("serverSession")) {
            targetSession = (WebSocketSession) session.getAttributes().get("serverSession");
        }
        
        // Reenviar el mensaje si hay una sesión destino válida
        if (targetSession != null && targetSession.isOpen()) {
            try {
                targetSession.sendMessage(message);
                log.debug("Mensaje reenviado: {} bytes", message.getPayloadLength());
            } catch (Exception e) {
                log.error("Error reenviando mensaje: {}", e.getMessage());
                session.close(CloseStatus.SERVER_ERROR);
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("Error en la sesión {}: {}", session.getId(), exception.getMessage());
        closeOtherSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        log.info("Conexión WebSocket cerrada para sesión {}: {}", session.getId(), closeStatus);
        closeOtherSession(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    private void closeOtherSession(WebSocketSession session) {
        try {
            WebSocketSession otherSession = null;
            if (session.getAttributes().containsKey("clientSession")) {
                otherSession = (WebSocketSession) session.getAttributes().get("clientSession");
            } else if (session.getAttributes().containsKey("serverSession")) {
                otherSession = (WebSocketSession) session.getAttributes().get("serverSession");
            }

            if (otherSession != null && otherSession.isOpen()) {
                otherSession.close(CloseStatus.SERVER_ERROR);
            }
        } catch (Exception e) {
            log.error("Error cerrando la otra sesión: {}", e.getMessage());
        }
    }

    @PostConstruct
    public void logConfiguration() {
        log.info("WebSocket handler registrado en: User/api/vnc/vm/{vmId}/socket");
    }
}

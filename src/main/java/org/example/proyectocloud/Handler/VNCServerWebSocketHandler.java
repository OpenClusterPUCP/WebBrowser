package org.example.proyectocloud.Handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.*;

public class VNCServerWebSocketHandler implements WebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(VNCServerWebSocketHandler.class);
    private final WebSocketSession clientSession;


    public VNCServerWebSocketHandler(WebSocketSession clientSession) {
        this.clientSession = clientSession;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("Iniciando conexión VNC sin autenticación...");
        clientSession.getAttributes().put("serverSession", session);
        session.getAttributes().put("clientSession", clientSession);
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        // Forward messages without authentication check
        if (clientSession.isOpen()) {
            try {
                clientSession.sendMessage(message);
            } catch (Exception e) {
                log.error("Error al reenviar mensaje: {}", e.getMessage());
                closeQuietly(session);
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("Error de transporte VNC: {}", exception.getMessage());
        closeQuietly(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        log.info("Conexión VNC cerrada: {}", closeStatus);
        closeQuietly(clientSession);
    }

    private void closeQuietly(WebSocketSession session) {
        if (session != null && session.isOpen()) {
            try {
                session.close(CloseStatus.NORMAL);
            } catch (Exception e) {
                log.warn("Error al cerrar sesión: {}", e.getMessage());
            }
        }
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}
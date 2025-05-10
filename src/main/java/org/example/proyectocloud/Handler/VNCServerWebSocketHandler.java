package org.example.proyectocloud.Handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

public class VNCServerWebSocketHandler implements WebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(VNCServerWebSocketHandler.class);
    private final WebSocketSession clientSession;

    public VNCServerWebSocketHandler(WebSocketSession clientSession) {
        this.clientSession = clientSession;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("Conexión establecida con servidor VNC: {}", session.getId());
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        if (clientSession.isOpen()) {
            clientSession.sendMessage(message);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("Error en conexión con servidor VNC: {}", exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        log.info("Conexión cerrada con servidor VNC: {}", closeStatus);
        if (clientSession.isOpen()) {
            clientSession.close(closeStatus);
        }
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}
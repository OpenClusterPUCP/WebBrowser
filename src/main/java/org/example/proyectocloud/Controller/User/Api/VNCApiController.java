package org.example.proyectocloud.Controller.User.Api;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Service.User.SliceService;
import org.example.proyectocloud.Service.User.VNCService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;

import java.io.IOException;
import java.util.Map;

@Controller
@RequestMapping("User/api/vnc")
@Slf4j
public class VNCApiController {

    @Autowired
    private VNCService vncService;

    private static final String SESSION_TOKEN_KEY = "userInfo";
    private static final String SESSION_USER_ID_KEY = "userInfo";

    private String getTokenFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_TOKEN_KEY);
        if (userInfo.getJwt() == null) {
            log.warn("No se encontró token en la sesión");
        }
        log.info("Token recuperado de la sesión: {}", userInfo.getJwt());
        return userInfo.getJwt();
    }

    private Integer getUserIdFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_USER_ID_KEY);
        if (userInfo == null || userInfo.getId() == null) {
            log.warn("No se encontró ID de usuario en la sesión");
            return null;
        }
        return userInfo.getId();
    }

    @PostMapping("/vm/{vmId}/token")
    @ResponseBody
    public ResponseEntity<?> getVMToken(@PathVariable Integer vmId, HttpSession session) {
        log.info("Recibida petición para obtener un token de acceso a consola/pantalla de VM: {}", vmId);
        try {
            String token = getTokenFromSession(session);
            Integer userId = getUserIdFromSession(session);
            
            if (token == null || userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Sesión no válida"));
            }

            Object result = vncService.getVMToken(token, vmId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error al pausar la VM: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

}
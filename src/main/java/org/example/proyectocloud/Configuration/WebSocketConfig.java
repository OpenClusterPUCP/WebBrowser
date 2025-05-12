package org.example.proyectocloud.Configuration;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpSession;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Handler.VNCWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private static final Logger log = LoggerFactory.getLogger(VNCWebSocketHandler.class);

    @Autowired
    private VNCWebSocketHandler vncWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(vncWebSocketHandler, "User/api/vnc/vm/*/socket")
               .addInterceptors(new HandshakeInterceptor() {
                   @Override
                   public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                                  WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
                       if (request instanceof ServletServerHttpRequest) {
                           ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
                           HttpSession session = servletRequest.getServletRequest().getSession();
                           UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
                           if (userInfo != null && userInfo.getJwt() != null) {
                               attributes.put("jwt", userInfo.getJwt());
                               return true;
                           }
                       }
                       return true;
                   }

                   @Override
                   public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                           WebSocketHandler wsHandler, Exception exception) {
                   }
               })
               .setAllowedOriginPatterns("http://localhost:[*]");
    }

    @PostConstruct
    public void init() {
        log.info("WebSocket configurado en: User/api/vnc/vm/*/socket");
    }
}
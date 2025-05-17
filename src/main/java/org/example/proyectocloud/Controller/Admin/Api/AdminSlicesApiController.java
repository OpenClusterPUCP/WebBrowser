package org.example.proyectocloud.Controller.Admin.Api;


import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Service.Admin.SliceAdminService;
import org.example.proyectocloud.Service.User.SliceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;

@RestController
@RequestMapping("/Admin/api/slices")
@Slf4j
public class AdminSlicesApiController {

    @Autowired
    private SliceAdminService sliceAdminService;

    // Constante para la clave del token en la sesión
    private static final String SESSION_TOKEN_KEY = "userInfo";
    private static final String SESSION_USER_ID_KEY = "userInfo";

    private String getTokenFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_TOKEN_KEY);
        if (userInfo.getJwt() == null) {
            log.warn("No se encontró token en la sesión");
        }
        return userInfo.getJwt();
    }

    private Integer getUserIdFromSession(HttpSession session) {
        Integer userId = ((UserInfo) session.getAttribute(SESSION_USER_ID_KEY)).getId();
        if (userId == null) {
            log.warn("No se encontró ID de usuario en la sesión");
            // Podrías lanzar una excepción aquí o manejar de otra forma
        }
        return userId;
    }

    @GetMapping("/list")
    public ResponseEntity<?> listarSlices(HttpSession session) {

        try{
            String token = getTokenFromSession(session);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Sesión no válida"));
            }
            Object slicesObj = sliceAdminService.getAllSlices(token);

            // Intentamos contar la cantidad de elementos si es una lista
            if (slicesObj instanceof java.util.List<?> slicesList) {
                log.info("Se recibieron {} slices desde el API Gateway", slicesList.size());
            } else {
                log.warn("La respuesta de getAllSlices no es una lista: {}", slicesObj != null ? slicesObj.getClass() : "null");
            }

            return ResponseEntity.ok(slicesObj);


        } catch (Exception e) {
            log.error("Error al obtener los slices: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al obtener los slices: " + e.getMessage()));
        }

    }





}

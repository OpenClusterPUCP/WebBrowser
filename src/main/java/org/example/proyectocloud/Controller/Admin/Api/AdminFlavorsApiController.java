package org.example.proyectocloud.Controller.Admin.Api;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.DTO.Admin.Flavors.FlavorRequest;
import org.example.proyectocloud.Service.Admin.AdminUsersService;
import org.example.proyectocloud.Service.Admin.FlavorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.*;

@RestController
@RequestMapping("/Admin/api/flavors")
@Slf4j
public class AdminFlavorsApiController {

    @Autowired
    private FlavorService flavorService;

    @Autowired
    private AdminUsersService userService;

    // Constante para la clave del token en la sesión
    private static final String SESSION_TOKEN_KEY = "userInfo";
    private static final String SESSION_USER_ID_KEY = "userInfo";

    /**
     * Método auxiliar para obtener el token de la sesión
     */
    private String getTokenFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_TOKEN_KEY);
        if (userInfo.getJwt() == null) {
            log.warn("No se encontró token en la sesión");
            // Podrías lanzar una excepción aquí o manejar de otra forma
        }
        return userInfo.getJwt();
    }

    /**
     * Método auxiliar para obtener el ID del usuario de la sesión
     */
    private Integer getUserIdFromSession(HttpSession session) {
        Integer userId = ((UserInfo) session.getAttribute(SESSION_USER_ID_KEY)).getId();
        if (userId == null) {
            log.warn("No se encontró ID de usuario en la sesión");
            // Podrías lanzar una excepción aquí o manejar de otra forma
        }
        return userId;
    }

    @GetMapping("/list")
    @ResponseBody
    public ResponseEntity<?> getAllFlavors(HttpSession session) {
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Sesión no válida"));
            }
            List<Map<String, Object>> flavors = (List<Map<String, Object>>) flavorService.getAllFlavors(token , getUserIdFromSession(session));

            // Crear respuesta compatible con DataTables
            Map<String, Object> response = new HashMap<>();
            response.put("data", flavors);
            System.out.println(response);


            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener los flavors: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al obtener los flavors: " + e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{idFlavor}")
    @ResponseBody
    public ResponseEntity<?> deleteFlavor(@PathVariable("idFlavor") Integer idFlavor, HttpSession session) {
        try {
            // Validate session token
            String token = getTokenFromSession(session);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("error", "Sesión no válida"));
            }

            // Try to delete the flavor
            Map<String, Object> flavors = (Map<String, Object>) flavorService.deleteFlavor(token, idFlavor);

            // Check if flavors is null or empty (deletion failed)
            if (flavors == null || flavors.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Flavor no encontrado o ya eliminado"));
            }

            // Create response compatible with DataTables
            Map<String, Object> response = new HashMap<>();
            response.put("data", flavors);
            response.put("success", true);
            response.put("message", "Flavor eliminado correctamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al eliminar el flavor: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al eliminar el flavor: " + e.getMessage()));
        }
    }



    @PostMapping("/update/{flavorId}")
    public Object updateFlavor(HttpSession session , @PathVariable("flavorId") Integer idFlavor, @RequestBody FlavorRequest flavorRequest ){


        try {
            // Validate session token
            String token = getTokenFromSession(session);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("error", "Sesión no válida"));
            }

            // Try to delete the flavor
            Map<String, Object> flavors = (Map<String, Object>)flavorService.updateFlavor(getTokenFromSession(session), flavorRequest , idFlavor , getUserIdFromSession(session));;

            // Check if flavors is null or empty (deletion failed)
            if (flavors == null || flavors.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Flavor no editado"));
            }

            // Create response compatible with DataTables
            Map<String, Object> response = new HashMap<>();
            response.put("data", flavors);
            response.put("success", true);
            response.put("message", "Flavor editado correctamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al eliminar el flavor: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al eliminar el flavor: " + e.getMessage()));
        }
    }

    @PostMapping("/create")
    public Object updaateFlavor(HttpSession session , @RequestBody FlavorRequest flavorRequest ){


        try {
            // Validate session token
            String token = getTokenFromSession(session);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("error", "Sesión no válida"));
            }

            // Try to delete the flavor

            Map<String, Object> flavors = new HashMap<String, Object>();
            if(flavorRequest.getType().equals("public")){
                 flavors = (Map<String, Object>)flavorService.createFlavor(getTokenFromSession(session), flavorRequest , 2 , getUserIdFromSession(session));;
            } else if (flavorRequest.getType().equals("private")) {
                flavorRequest.setUserId(getUserIdFromSession(session));
                 flavors = (Map<String, Object>)flavorService.createFlavor(getTokenFromSession(session), flavorRequest , 2 , getUserIdFromSession(session));;
            }

            // Check if flavors is null or empty (deletion failed)
            if (flavors == null || flavors.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Flavor No creado"));
            }

            // Create response compatible with DataTables
            Map<String, Object> response = new HashMap<>();
            response.put("data", flavors);
            response.put("success", true);
            response.put("message", "Flavor creado correctamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al eliminar el flavor: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al eliminar el flavor: " + e.getMessage()));
        }
    }

}

package org.example.proyectocloud.Controller;

import jakarta.servlet.http.HttpSession;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Service.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.*;

@Controller
@RequestMapping("/Admin")
public class AdminController {

    @Autowired
    private UsersService usersService;

    @GetMapping("/slices")
    public String verSlices(){
        return "/AdminPages/SlicesList";
    }


    @GetMapping("/users")
    public String verUsuarios(){
        return "/AdminPages/UsersList";
    }

    @GetMapping("/template")
    public String verTemplate(){
        return "/AdminPages/templateAdmin";
    }
    @GetMapping("/api/users")
    @ResponseBody
    public ResponseEntity<?> getUsersData(HttpSession session) {
        System.out.println("==== INICIO DE SOLICITUD getUsersData ====");
        try {
            // Verificar explícitamente la sesión
            if (session == null) {
                System.out.println("ERROR: No hay sesión activa");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("error", "No hay sesión activa"));
            }
            System.out.println("✓ Sesión encontrada, ID: " + session.getId());

            // Verificar información de usuario en la sesión
            UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
            if (userInfo == null) {
                System.out.println("ERROR: No hay objeto UserInfo en la sesión");

                // Listar todos los atributos de la sesión para depuración
                System.out.println("Atributos de sesión disponibles:");
                Enumeration<String> attributeNames = session.getAttributeNames();
                while (attributeNames.hasMoreElements()) {
                    String name = attributeNames.nextElement();
                    System.out.println("  - " + name + ": " + session.getAttribute(name));
                }

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("error", "No hay información de usuario en la sesión"));
            }
            System.out.println("✓ Objeto UserInfo encontrado en la sesión");
            System.out.println("  - Username: " + userInfo.getUsername());
            System.out.println("  - Rol: " + userInfo.getRole());

            // Verificar token JWT
            String token = userInfo.getJwt();
            if (token == null || token.trim().isEmpty()) {
                System.out.println("ERROR: Token JWT ausente o vacío");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("error", "Token JWT no disponible"));
            }
            System.out.println("✓ Token JWT presente (primeros 10 caracteres): " +
                    token.substring(0, Math.min(10, token.length())) + "...");

            // Llamada al servicio
            System.out.println("Llamando a usersService.consumirApiProtegidaAdmin()...");
            Object result = usersService.consumirApiProtegidaAdmin(token);

            // Verificar el resultado
            if (result == null) {
                System.out.println("ERROR: El servicio devolvió un resultado nulo");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Collections.singletonMap("error", "El servicio devolvió un resultado nulo"));
            }

            // Detectar si el resultado es un error
            if (result instanceof String) {
                String strResult = (String) result;
                System.out.println("Resultado como String: " + strResult);

                if (strResult.contains("Error")) {
                    System.out.println("ERROR: El servicio devolvió un mensaje de error");
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Collections.singletonMap("error", strResult));
                }
            } else if (result instanceof Map) {
                Map<?, ?> mapResult = (Map<?, ?>) result;
                System.out.println("Resultado como Map: " + mapResult);

                if (mapResult.containsKey("error") || mapResult.containsKey("status") && ((Integer)mapResult.get("status") >= 400)) {
                    System.out.println("ERROR: El servicio devolvió un mapa con indicación de error");
                    return ResponseEntity.status(
                            mapResult.containsKey("status") ? (Integer)mapResult.get("status") : HttpStatus.INTERNAL_SERVER_ERROR.value()
                    ).body(result);
                }
            } else {
                System.out.println("Resultado obtenido de tipo: " + result.getClass().getName());
                System.out.println("Contenido: " + result);
            }

            System.out.println("✓ Solicitud procesada exitosamente");
            System.out.println("==== FIN DE SOLICITUD getUsersData ====");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("==== ERROR GRAVE EN getUsersData ====");
            System.err.println("Mensaje de error: " + e.getMessage());
            System.err.println("Tipo de excepción: " + e.getClass().getName());
            System.err.println("Traza de la pila:");
            e.printStackTrace();

            // Verificar si hay una causa raíz
            if (e.getCause() != null) {
                System.err.println("Causa raíz: " + e.getCause().getMessage());
                System.err.println("Tipo de causa raíz: " + e.getCause().getClass().getName());
            }

            // Construir un mapa con información detallada del error
            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("error", "Error interno del servidor");
            errorDetails.put("message", e.getMessage());
            errorDetails.put("type", e.getClass().getName());
            errorDetails.put("timestamp", new Date().toString());

            System.err.println("==== FIN DE ERROR GRAVE ====");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorDetails);
        }
    }


    //Si quieres crear apis  usa  /api/"Lo q quieras"
}

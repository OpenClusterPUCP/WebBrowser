package org.example.proyectocloud.Controller.Auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Dao.AuthDao;
import org.example.proyectocloud.Service.Auth.AuthService;
import org.example.proyectocloud.Service.Auth.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Controller
@Slf4j
public class LoginController {
    private final AuthService authService;
    public LoginController(AuthService authService) {
        this.authService = authService;
    }
    @Autowired
    AuthDao authDao;
    @Autowired
    private PasswordResetService passwordResetService;

    //Ver frontEnd
    @GetMapping({"/" })
    public String login(HttpSession http) {
        if (http.getAttribute("userInfo") != null) {
            UserInfo userSession = (UserInfo) http.getAttribute("userInfo");
            String rol = userSession.getRole();
            if (rol.equals("Admin")) {
                return "redirect:/Admin/users";
            }
            if (rol.equals("User")) {
                return "redirect:/User/slice";
            }
            if (rol.equals("Aws")) {
                return "redirect:/Aws/slice";
            }
        }
        return "AuthPages/login";
    }
    @GetMapping({"/error-503"})
    public String Error403() {
        return "/ErrorPages/error-503";
    }
    @GetMapping("/logout")
    public String logout(HttpServletRequest request) {
        // Invalidate session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return "redirect:/login?logout";
    }
    @PostMapping("/InicioSesion")
    @ResponseBody
    public ResponseEntity<?> verToken(@RequestBody LinkedHashMap<String, Object> credentials, HttpSession session) {
        // Verificar que se proporcionan las credenciales necesarias
        if (credentials.get("username") == null || credentials.get("password") == null) {
            LinkedHashMap<String, Object> response = new LinkedHashMap<>();
            response.put("status", "error");
            response.put("message", "Username and password are required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        // Intentar autenticar al usuario
        Object authResult = authDao.autenticarYObtenerJwt(
                credentials.get("username").toString(),
                credentials.get("password").toString());
        if (authResult instanceof ResponseEntity) {
            ResponseEntity<?> authResponse = (ResponseEntity<?>) authResult;
            HttpStatus status = (HttpStatus) authResponse.getStatusCode();

            // Verificar si la autenticación fue exitosa
            if (status.equals(HttpStatus.OK)) {
                System.out.println("OKK");
                // Autenticación exitosa, guardar token en sesión
                LinkedHashMap<String, Object> tokenData = (LinkedHashMap<String, Object>) authResponse.getBody();
                // Assuming tokenData.get("roles") contains a single String value
                String role = (String) tokenData.get("role");
// Add ROLE_ prefix if needed
                String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
// Create a list with a single authority
                List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(roleWithPrefix));
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        credentials.get("username"), null, authorities);

                SecurityContext context = SecurityContextHolder.getContext();
                context.setAuthentication(authToken);
                SecurityContextHolder.setContext(context);
                // Guardar el token JWT y los roles en la sesión
                // Si hay roles disponibles, guardarlos también
                UserInfo userInfo =  new UserInfo();
                userInfo.setId((Integer) tokenData.get("id"));
                userInfo.setName((String) tokenData.get("name"));
                userInfo.setLastname((String) tokenData.get("lastname"));
                userInfo.setUsername((String) tokenData.get("username"));
                userInfo.setCode((String) tokenData.get("code"));
                userInfo.setJwt((String) tokenData.get("jwt"));
                userInfo.setRole(role); // Store the original role without prefix
                // Save UserInfo to session
                session.setAttribute("userInfo", userInfo);
                // Para compatibilidad con el código anterior


                // Guardar username si está disponible
                if (tokenData.containsKey("username")) {
                    session.setAttribute("username", tokenData.get("username"));
                }

                // Crear respuesta para el frontend
                LinkedHashMap<String, Object> response = new LinkedHashMap<>();
                response.put("status", "ok");
                response.put("content", "Admin"); // Mantener compatibilidad
                response.put("message", "Login successful");
                response.put("token", tokenData.get("jwt"));

                // Añadir información útil para el frontend (opcional)
                if (tokenData.containsKey("username")) {
                    response.put("username", tokenData.get("username"));
                }

                return ResponseEntity.status(HttpStatus.OK).body(response);
            } else {
                System.out.println("FALLO");
                // Autenticación fallida, devolver la información de error
                LinkedHashMap<String, Object> errorResponse = new LinkedHashMap<>();
                errorResponse.put("status", "error");

                // Obtener mensaje de error si está disponible
                if (authResponse.getBody() instanceof LinkedHashMap) {
                    LinkedHashMap<String, Object> errorBody = (LinkedHashMap<String, Object>) authResponse.getBody();
                    if (errorBody.containsKey("message")) {
                        errorResponse.put("message", errorBody.get("message"));
                    }
                }

                // Añadir mensajes claros según el código de estado
                if (status.equals(HttpStatus.UNAUTHORIZED)) {
                    errorResponse.put("action", "credentials");
                    if (!errorResponse.containsKey("message")) {
                        errorResponse.put("message", "Invalid username or password");
                    }
                } else if (status.equals(HttpStatus.FORBIDDEN)) {
                    errorResponse.put("action", "contact_admin");
                    if (!errorResponse.containsKey("message")) {
                        errorResponse.put("message", "Your account is disabled or lacks permission");
                    }
                } else if (status.equals(HttpStatus.SERVICE_UNAVAILABLE)) {
                    errorResponse.put("action", "try_later");
                    if (!errorResponse.containsKey("message")) {
                        errorResponse.put("message", "Authentication service is currently unavailable");
                    }
                } else {
                    errorResponse.put("action", "contact_support");
                    if (!errorResponse.containsKey("message")) {
                        errorResponse.put("message", "An unexpected error occurred");
                    }
                }

                return ResponseEntity.status(status).body(errorResponse);
            }
        } else {
            // Mantener compatibilidad con la versión anterior para tipos de retorno String
            if (authResult instanceof String) {
                String error = (String) authResult;
                LinkedHashMap<String, Object> response = new LinkedHashMap<>();
                response.put("status", "error");

                if (error.equals("ERROR_SERVICIO_NO_DISPONIBLE")) {
                    response.put("message", "Authentication service is currently unavailable");
                    response.put("action", "try_later");
                    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
                } else if (error.equals("ERROR_UNAUTHORIZED")) {
                    response.put("message", "Invalid username or password");
                    response.put("action", "credentials");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                } else if (error.startsWith("ERROR_")) {
                    response.put("message", "Authentication failed");
                    response.put("action", "contact_support");
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
                }
            }

            // Respuesta por defecto para casos inesperados
            LinkedHashMap<String, Object> response = new LinkedHashMap<>();
            response.put("status", "error");
            response.put("message", "An unexpected error occurred");
            response.put("action", "contact_support");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


    /**
     * Endpoint para solicitar el restablecimiento de contraseña.
     * Recibe el correo electrónico del usuario y envía un enlace de restablecimiento.
     *
     * @param requestMap Mapa con el correo electrónico
     * @return Respuesta con el resultado de la operación
     */
    @PostMapping("/ResetPassword")
    @ResponseBody
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> requestMap) {
        log.info("Recibida solicitud de restablecimiento de contraseña");

        // Verificar que se proporciona el correo electrónico
        if (!requestMap.containsKey("email") || requestMap.get("email") == null || requestMap.get("email").isEmpty()) {
            log.warn("Solicitud de restablecimiento rechazada: email no proporcionado");
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Email is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        }

        String email = requestMap.get("email");
        log.info("Procesando solicitud de restablecimiento para email: {}", email);

        try {
            // Llamar al servicio para solicitar el restablecimiento
            log.debug("Llamando al servicio de restablecimiento de contraseña");
            Map<String, Object> result = passwordResetService.requestPasswordReset(email);
            log.debug("Respuesta del servicio de restablecimiento: {}", result);

            // Comprobar el resultado y devolver la respuesta adecuada
            if ("success".equals(result.get("status"))) {
                log.info("Solicitud de restablecimiento procesada con éxito para: {}", email);
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(result);
            } else {
                HttpStatus status;

                // Determinar el código de estado según el resultado
                if (result.containsKey("code")) {
                    int code = (Integer) result.get("code");
                    status = HttpStatus.valueOf(code);
                    log.warn("Error en solicitud de restablecimiento: {} - {}", status, result.get("message"));
                } else {
                    status = HttpStatus.INTERNAL_SERVER_ERROR;
                    log.error("Error interno en solicitud de restablecimiento sin código de estado");
                }

                return ResponseEntity.status(status)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(result);
            }
        } catch (Exception e) {
            log.error("Excepción no controlada en solicitud de restablecimiento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Error interno del servidor al procesar la solicitud");
            errorResponse.put("details", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    /**
     * Página para cambiar la contraseña después de usar un token de restablecimiento.
     *
     * @param token Token de restablecimiento de contraseña
     * @param model Modelo para la vista
     * @return Vista de cambio de contraseña o redirección a login
     */
    @GetMapping("/password-reset")
    public String showPasswordResetPage(@RequestParam(required = false) String token, Model model) {
        log.info("Acceso a página de restablecimiento de contraseña");

        // Si no hay token, redirigir al login
        if (token == null || token.isEmpty()) {
            log.warn("Acceso a página de restablecimiento rechazado: token no proporcionado");
            return "redirect:/";
        }

        log.debug("Verificando token de restablecimiento: {}", token);

        try {
            // Verificar el token
            Map<String, Object> verificationResult = passwordResetService.verifyResetToken(token);
            log.debug("Resultado de verificación del token: {}", verificationResult);

            if ("success".equals(verificationResult.get("status"))) {
                // Token válido, mostrar página para cambiar contraseña
                log.info("Token válido, mostrando página de cambio de contraseña");
                model.addAttribute("token", token);
                model.addAttribute("email", verificationResult.get("email"));
                return "AuthPages/resetPassword";
            } else {
                // Token inválido, redirigir al login con mensaje de error
                log.warn("Token inválido o expirado, redirigiendo a login");
                return "redirect:/?error=invalid_token";
            }
        } catch (Exception e) {
            log.error("Error al verificar token de restablecimiento: {}", e.getMessage(), e);
            return "redirect:/?error=system_error";
        }
    }

    /**
     * Endpoint para cambiar la contraseña usando un token de restablecimiento.
     *
     * @param requestMap Mapa con el token y la nueva contraseña
     * @return Respuesta con el resultado de la operación
     */
    @PostMapping("/password-reset/confirm")
    @ResponseBody
    public ResponseEntity<?> confirmPasswordReset(@RequestBody Map<String, String> requestMap) {
        log.info("Recibida solicitud para confirmar restablecimiento de contraseña");

        // Verificar que se proporcionan los datos necesarios
        if (!requestMap.containsKey("token") || requestMap.get("token") == null ||
                !requestMap.containsKey("newPassword") || requestMap.get("newPassword") == null) {
            log.warn("Solicitud de confirmación rechazada: token o contraseña no proporcionados");
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Token and new password are required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        }

        String token = requestMap.get("token");
        String newPassword = requestMap.get("newPassword");
        log.debug("Procesando confirmación de restablecimiento con token: {}", token);

        // Validar la longitud de la contraseña
        if (newPassword.length() < 6) {
            log.warn("Contraseña rechazada: longitud inferior a 6 caracteres");
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Password must be at least 6 characters long");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        }

        try {
            // Llamar al servicio para cambiar la contraseña
            log.debug("Llamando al servicio para restablecer contraseña");
            Map<String, Object> result = passwordResetService.resetPassword(token, newPassword);
            log.debug("Respuesta del servicio de restablecimiento: {}", result);

            // Comprobar el resultado y devolver la respuesta adecuada
            if ("success".equals(result.get("status"))) {
                log.info("Contraseña restablecida con éxito");
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(result);
            } else {
                HttpStatus status;

                // Determinar el código de estado según el resultado
                if (result.containsKey("code")) {
                    int code = (Integer) result.get("code");
                    status = HttpStatus.valueOf(code);
                    log.warn("Error al restablecer contraseña: {} - {}", status, result.get("message"));
                } else {
                    status = HttpStatus.INTERNAL_SERVER_ERROR;
                    log.error("Error interno al restablecer contraseña sin código de estado");
                }

                return ResponseEntity.status(status)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(result);
            }
        } catch (Exception e) {
            log.error("Excepción no controlada al restablecer contraseña: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Error interno del servidor al procesar la solicitud");
            errorResponse.put("details", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

}

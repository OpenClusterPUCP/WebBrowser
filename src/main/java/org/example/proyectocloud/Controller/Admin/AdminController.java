package org.example.proyectocloud.Controller.Admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.example.proyectocloud.Service.Admin.AdminProfileService;
import org.example.proyectocloud.Service.Admin.AdminUsersService;
import org.example.proyectocloud.Service.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controlador principal para las vistas del Administrador
 */
@Controller
@RequestMapping("/Admin")
@Slf4j
public class AdminController {

    @Autowired
    private AdminProfileService adminProfileService;

    /**
     * Muestra el dashboard principal del administrador.
     *
     * @param model Modelo para pasar datos a la vista
     * @return Vista del dashboard
     */
    @GetMapping("")
    public String dashboard(Model model) {
        log.info("Accediendo al dashboard de administración");
        model.addAttribute("activeMenu", "dashboard");
        return "AdminPages/Dashboard";
    }

    /**
     * Redirecciona /dashboard a la ruta principal de administración.
     *
     * @param model Modelo para pasar datos a la vista
     * @return Redirección al dashboard principal
     */
    @GetMapping("/dashboard")
    public String dashboardRedirect(Model model) {
        log.debug("Redirigiendo /dashboard a ruta principal de administración");
        return "redirect:/Admin";
    }

    /**
     * Muestra la página de gestión de slices.
     *
     * @param model Modelo para pasar datos a la vista
     * @return Vista de gestión de slices
     */
    @GetMapping("/slices")
    public String verSlices(Model model) {
        log.info("Accediendo a gestión de slices");
        model.addAttribute("activeMenu", "slices");
        return "AdminPages/SlicesList";
    }

    /**
     * Método auxiliar para obtener el token JWT y el ID del usuario desde la sesión
     * usando la clase UserInfo
     *
     * @param session Sesión HTTP
     * @return Objeto con token JWT e ID de usuario
     */
    private Map<String, Object> getUserCredentials(HttpSession session) {
        Map<String, Object> credentials = new HashMap<>();

        // Obtener UserInfo de la sesión
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");

        if (userInfo != null) {
            log.debug("UserInfo encontrado en sesión: {}", userInfo.getUsername());
            credentials.put("token", userInfo.getJwt());
            credentials.put("userId", userInfo.getId());
            credentials.put("username", userInfo.getUsername());
            return credentials;
        }

        log.warn("No se encontró información de usuario en la sesión");
        return credentials;
    }

    /**
     * Muestra la página de perfil del administrador con sus datos.
     *
     * @param model Modelo para pasar datos a la vista
     * @param request Petición HTTP
     * @param session Sesión HTTP donde se almacena UserInfo
     * @return Vista de perfil de administrador
     */
    @GetMapping("/profile")
    public String verPerfil(Model model, HttpServletRequest request, HttpSession session) {
        log.info("Accediendo a vista de perfil de administrador");

        try {
            // Obtener credenciales del usuario desde la sesión
            Map<String, Object> credentials = getUserCredentials(session);
            String token = (String) credentials.get("token");
            Integer userId = (Integer) credentials.get("userId");

            // Si no se pudo obtener el ID, usar valor predeterminado para pruebas
            if (userId == null) {
                log.warn("Usando ID predeterminado para pruebas");
                userId = 2; // Solo para pruebas en desarrollo
            }

            log.debug("ID de usuario para cargar perfil: {}", userId);

            // Obtener datos del perfil y métricas
            Map<String, Object> userProfileData = null;
            Map<String, Object> metricsData = null;

            if (token != null) {
                log.debug("Token JWT encontrado en sesión, obteniendo datos del perfil");
                userProfileData = adminProfileService.getUserProfile(userId, token);
                metricsData = adminProfileService.getAdminMetrics(userId, token);
            } else {
                log.warn("No se pudo obtener el token JWT, se usarán datos estáticos");
            }

            // Procesar datos del perfil
            if (userProfileData != null && !userProfileData.containsKey("status")) {
                // Transformar nombres de campos si es necesario
                if (userProfileData.containsKey("lastLogin")) {
                    userProfileData.put("last_login", userProfileData.get("lastLogin"));
                }
                if (userProfileData.containsKey("createdAt")) {
                    userProfileData.put("created_at", userProfileData.get("createdAt"));
                }

                model.addAttribute("user", userProfileData);
            } else {
                log.warn("Usando datos de perfil estáticos");
                model.addAttribute("user", createStaticProfile(userId));
            }

            // Procesar datos de métricas
            if (metricsData != null && !metricsData.containsKey("status")) {
                if (metricsData.containsKey("metrics")) {
                    model.addAttribute("metrics", metricsData.get("metrics"));
                } else {
                    model.addAttribute("metrics", createStaticMetrics());
                }

                if (metricsData.containsKey("recentActivities")) {
                    model.addAttribute("recentActivities", metricsData.get("recentActivities"));
                } else {
                    model.addAttribute("recentActivities", createStaticActivities());
                }

                if (metricsData.containsKey("security")) {
                    model.addAttribute("security", metricsData.get("security"));
                } else {
                    model.addAttribute("security", createStaticSecurity());
                }
            } else {
                log.warn("Usando datos de métricas estáticos");
                model.addAttribute("metrics", createStaticMetrics());
                model.addAttribute("recentActivities", createStaticActivities());
                model.addAttribute("security", createStaticSecurity());
            }

            // Marcar enlace activo en el menú
            model.addAttribute("activeMenu", "profile");

            return "AdminPages/AdminProfile";
        } catch (Exception e) {
            log.error("Error al obtener datos para la vista de perfil: {}", e.getMessage(), e);

            // Usar datos estáticos para la visualización
            model.addAttribute("user", createStaticProfile(2));
            model.addAttribute("metrics", createStaticMetrics());
            model.addAttribute("recentActivities", createStaticActivities());
            model.addAttribute("security", createStaticSecurity());

            model.addAttribute("activeMenu", "profile");
            return "AdminPages/AdminProfile";
        }
    }

    // Métodos para crear datos estáticos (refactorizar los existentes)
    private Map<String, Object> createStaticProfile(Integer userId) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", userId);
        profile.put("username", "admin@pucp.edu.pe");
        profile.put("name", "Administrador");
        profile.put("lastname", "Principal");
        profile.put("code", "ADMIN001");
        profile.put("role", "Administrador");
        profile.put("roleId", 2);
        profile.put("state", "1");
        profile.put("created_at", "01-05-2025 00:00:00");
        profile.put("last_login", "06-05-2025 16:54:35");
        return profile;
    }

    private Map<String, Object> createStaticMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("slicesManaged", 12);
        metrics.put("usersManaged", 24);
        metrics.put("vmsCreated", 56);
        return metrics;
    }

    private Object[] createStaticActivities() {
        Map<String, Object> activity1 = new HashMap<>();
        activity1.put("type", "slice_creation");
        activity1.put("description", "Creación de nuevo Slice");
        activity1.put("timestamp", "Hace 2 horas");

        Map<String, Object> activity2 = new HashMap<>();
        activity2.put("type", "user_creation");
        activity2.put("description", "Usuario añadido al sistema");
        activity2.put("timestamp", "Ayer");

        Map<String, Object> activity3 = new HashMap<>();
        activity3.put("type", "resource_config");
        activity3.put("description", "Configuración de recursos");
        activity3.put("timestamp", "Hace 3 días");

        return new Object[]{activity1, activity2, activity3};
    }

    private Map<String, Object> createStaticSecurity() {
        Map<String, Object> security = new HashMap<>();
        security.put("lastPasswordChange", "Hace 30 días");
        security.put("activeSessions", 1);
        return security;
    }
}
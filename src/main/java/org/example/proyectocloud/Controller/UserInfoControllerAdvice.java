package org.example.proyectocloud.Controller;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/**
 * Método para agregar información del usuario al modelo para todos los controladores
 * de la aplicación. Esto permite que los datos del usuario estén disponibles
 * en todas las vistas, incluido el fragmento del header.
 */
@ControllerAdvice
@Slf4j
public class UserInfoControllerAdvice {

    /**
     * Añade información del usuario autenticado a todos los modelos
     * para que esté disponible en todas las vistas, incluyendo fragmentos.
     *
     * @param model El modelo que se pasa a la vista
     * @param session La sesión HTTP actual
     */
    @ModelAttribute
    public void addUserInfoToModel(Model model, HttpSession session) {
        try {
            // Obtener UserInfo de la sesión
            UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");

            if (userInfo != null) {
                // Si existe la información del usuario en sesión, agregarla al modelo
                model.addAttribute("userName", userInfo.getName() + " " + userInfo.getLastname());
                model.addAttribute("userRole", userInfo.getRole());

                // Crear iniciales para el avatar
                String initials = "";
                if (userInfo.getName() != null && !userInfo.getName().isEmpty()) {
                    initials += userInfo.getName().charAt(0);
                }
                if (userInfo.getLastname() != null && !userInfo.getLastname().isEmpty()) {
                    initials += userInfo.getLastname().charAt(0);
                }

                model.addAttribute("userInitials", initials.toUpperCase());
                log.debug("Información de usuario añadida al modelo: {}", userInfo.getUsername());
            } else {
                // Si no hay información, usar valores por defecto
                model.addAttribute("userName", "Usuario");
                model.addAttribute("userRole", "Invitado");
                model.addAttribute("userInitials", "UI");
                log.debug("No se encontró información de usuario en la sesión, usando valores por defecto");
            }
        } catch (Exception e) {
            // En caso de error, usar valores por defecto
            log.error("Error al añadir información de usuario al modelo: {}", e.getMessage());
            model.addAttribute("userName", "Usuario");
            model.addAttribute("userRole", "Invitado");
            model.addAttribute("userInitials", "UI");
        }
    }
}
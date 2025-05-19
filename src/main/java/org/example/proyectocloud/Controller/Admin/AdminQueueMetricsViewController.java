package org.example.proyectocloud.Controller.Admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/Admin/queue-metrics")
@Slf4j
public class AdminQueueMetricsViewController {

    /**
     * Muestra la página principal de métricas de colas.
     */
    @GetMapping
    public String showQueueMetrics(Model model, HttpServletRequest request) {
        log.info("Accediendo a la página de métricas de colas");

        // Obtener información del usuario de la sesión
        HttpSession session = request.getSession();
        String userName = (String) session.getAttribute("userName");
        String userRole = (String) session.getAttribute("userRole");

        // Agregar información del usuario al modelo
        model.addAttribute("userName", userName);
        model.addAttribute("userRole", userRole);

        // Información adicional para la vista
        model.addAttribute("pageTitle", "Métricas de Colas");
        model.addAttribute("pageDescription", "Monitoreo y estadísticas del sistema de colas");

        return "AdminPages/QueueMetrics";
    }
}
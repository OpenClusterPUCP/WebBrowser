package org.example.proyectocloud.Controller.Admin;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controlador para las vistas relacionadas con la gestión de zonas de disponibilidad.
 * Se encarga de renderizar las páginas de listado y detalles de zonas de disponibilidad.
 */
@Controller
@RequestMapping("/Admin/availability-zones")
@Slf4j
public class AdminAvailabilityZonesController {

    //@Autowired
   // private AvailabilityZoneService availabilityZoneService;

    /**
     * Muestra el listado de todas las zonas de disponibilidad.
     *
     * @param model Modelo para pasar datos a la vista
     * @param session Sesión HTTP para obtener el token JWT
     * @return Vista de listado de zonas de disponibilidad
     */
    @GetMapping("")
    public String listarZonasDisponibilidad(Model model, HttpSession session) {
        log.info("Cargando listado de zonas de disponibilidad");
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");


        return "/AdminPages/AvailabilityZones";
    }


    @GetMapping("/{id}")
    public String verDetalleZona(@PathVariable Integer id, Model model, HttpSession session) {
        // Lógica para cargar datos de la zona
        return "/AdminPages/AvailabilityZoneDetail";
    }

    @GetMapping("/{id}/monitoring")
    public String verMonitoreoZona(@PathVariable Integer id, Model model, HttpSession session) {
        // Lógica para cargar datos de monitoreo
        return "/AdminPages/AvailabilityZoneMonitoring";
    }


}

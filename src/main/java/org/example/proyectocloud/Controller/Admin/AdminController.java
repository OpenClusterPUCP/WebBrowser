package org.example.proyectocloud.Controller.Admin;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.example.proyectocloud.Service.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Controller
@RequestMapping("/Admin")
@Slf4j
public class AdminController {

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
        return "/AdminPages/SlicesList";
    }





}

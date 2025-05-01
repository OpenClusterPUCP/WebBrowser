package org.example.proyectocloud.Controller.Admin;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.example.proyectocloud.Service.Admin.AdminUsersService;
import org.example.proyectocloud.Service.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

/**
 * Controlador para las vistas relacionadas con la gestión de usuarios.
 * Se encarga de renderizar las páginas de listado, creación, edición y detalle de usuarios.
 */
@Controller
@RequestMapping("/Admin/users")
@Slf4j
public class AdminUsersViewController {

    @Autowired
    private AdminUsersService adminUsersService;

    /**
     * Muestra el listado de todos los usuarios.
     *
     * @param model Modelo para pasar datos a la vista
     * @param session Sesión HTTP para obtener el token JWT
     * @return Vista de listado de usuarios
     */
    @GetMapping("")
    public String listarUsuarios(Model model, HttpSession session) {
        log.info("Cargando listado de usuarios");
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        List<UserDTO> usersData = adminUsersService.getAllUsers(userInfo.getJwt());

        log.debug("Se encontraron {} usuarios", usersData.size());

        // Convertir el estado para que coincida con lo que espera la vista
        usersData.forEach(user -> {
            if ("1".equals(user.getState())) {
                user.setState("active");
            } else if ("0".equals(user.getState())) {
                user.setState("banned");
            }
        });

        model.addAttribute("usersData", usersData);
        model.addAttribute("activeMenu", "users");

        return "/AdminPages/UsersList";
    }


    /**
     * Muestra el formulario para editar un usuario existente.
     *
     * @param id ID del usuario a editar
     * @param model Modelo para pasar datos a la vista
     * @param session Sesión HTTP para obtener el token JWT
     * @return Vista con formulario de edición o redirección al listado si no se encuentra el usuario
     */
    @GetMapping("/{id}/edit")
    public String mostrarFormularioEdicion(@PathVariable Integer id, Model model, HttpSession session) {
        log.info("Mostrando formulario de edición para usuario ID: {}", id);
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        UserDTO user = adminUsersService.getUserById(id, userInfo.getJwt());

        if (user == null) {
            log.warn("No se encontró el usuario con ID: {}", id);
            return "redirect:/Admin/users";
        }

        // Convertir estado si es necesario
        if ("1".equals(user.getState())) {
            user.setState("active");
        } else if ("0".equals(user.getState())) {
            user.setState("banned");
        }

        model.addAttribute("user", user);
        model.addAttribute("activeMenu", "users");
        model.addAttribute("isNew", false);

        return "/AdminPages/UserForm";
    }

    /**
     * Muestra los detalles de un usuario específico.
     *
     * @param id ID del usuario a mostrar
     * @param model Modelo para pasar datos a la vista
     * @param session Sesión HTTP para obtener el token JWT
     * @return Vista de detalle o redirección al listado si no se encuentra el usuario
     */
    @GetMapping("/{id}")
    public String verDetalleUsuario(@PathVariable Integer id, Model model, HttpSession session) {
        log.info("Mostrando detalles del usuario ID: {}", id);
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        UserDTO user = adminUsersService.getUserById(id, userInfo.getJwt());

        if (user == null) {
            log.warn("No se encontró el usuario con ID: {}", id);
            return "redirect:/Admin/users";
        }

        // Convertir estado si es necesario
        if ("1".equals(user.getState())) {
            user.setState("active");
        } else if ("0".equals(user.getState())) {
            user.setState("banned");
        }

        model.addAttribute("user", user);
        model.addAttribute("activeMenu", "users");

        return "/AdminPages/UserDetail";
    }

    /**
     * Muestra el listado de usuarios filtrado por rol.
     *
     * @param roleId ID del rol para filtrar
     * @param model Modelo para pasar datos a la vista
     * @param session Sesión HTTP para obtener el token JWT
     * @return Vista de listado de usuarios filtrado por rol
     */
    @GetMapping("/role/{roleId}")
    public String listarUsuariosPorRol(@PathVariable Integer roleId, Model model, HttpSession session) {
        log.info("Cargando usuarios filtrados por rol ID: {}", roleId);
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        List<UserDTO> usersData = adminUsersService.getUsersByRole(roleId, userInfo.getJwt());

        log.debug("Se encontraron {} usuarios con rol ID: {}", usersData.size(), roleId);

        // Convertir el estado para que coincida con lo que espera la vista
        usersData.forEach(user -> {
            if ("1".equals(user.getState())) {
                user.setState("active");
            } else if ("0".equals(user.getState())) {
                user.setState("banned");
            }
        });

        model.addAttribute("usersData", usersData);
        model.addAttribute("roleId", roleId);
        model.addAttribute("activeMenu", "users");

        return "/AdminPages/UsersList";
    }
}
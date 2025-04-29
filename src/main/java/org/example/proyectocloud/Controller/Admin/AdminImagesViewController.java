package org.example.proyectocloud.Controller.Admin;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/Admin")
@Slf4j
public class AdminImagesViewController {
    private static final String SESSION_USER_ID_KEY = "userInfo";

    private Integer getUserIdFromSession(HttpSession session) {
        Integer userId = ((UserInfo) session.getAttribute(SESSION_USER_ID_KEY)).getId();
        if (userId == null) {
            log.warn("No se encontró ID de usuario en la sesión");
            // Podrías lanzar una excepción aquí o manejar de otra forma
        }
        return userId;
    }

    @GetMapping("/images")
    public String verFlavors(Model model, HttpSession session){
        log.info("Accediendo a gestión de slices");
        model.addAttribute("activeMenu", "flavors");
        model.addAttribute("idUser" , getUserIdFromSession(session));
        return "/AdminPages/ImagesList";
    }
}

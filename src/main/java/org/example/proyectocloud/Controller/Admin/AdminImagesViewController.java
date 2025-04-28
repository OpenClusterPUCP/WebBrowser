package org.example.proyectocloud.Controller.Admin;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/Admin")
@Slf4j
public class AdminImagesViewController {
    @GetMapping("/images")
    public String verFlavors(Model model){
        log.info("Accediendo a gestión de slices");
        model.addAttribute("activeMenu", "flavors");
        return "/AdminPages/ImagesList";
    }
}

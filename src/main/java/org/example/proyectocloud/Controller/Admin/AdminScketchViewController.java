package org.example.proyectocloud.Controller.Admin;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/Admin")

public class AdminScketchViewController {
    @GetMapping("/scketch")
    public String verScketch(){
        return "AdminPages/Scketch";
    }
}

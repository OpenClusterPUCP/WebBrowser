package org.example.proyectocloud.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminController {
    @GetMapping("/Admin/slices")
    public String verSlices(){
        return "/AdminPages/SlicesList";
    }
}

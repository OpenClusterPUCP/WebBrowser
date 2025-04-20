package org.example.proyectocloud.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/Admin")
public class AdminController {
    @GetMapping("/Admin/slices")
    public String verSlices(){
        return "/AdminPages/SlicesList";
    }



    //Si quieres crear apis  usa  /api/"Lo q quieras"
}

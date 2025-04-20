package org.example.proyectocloud.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class UserController {

    @GetMapping("/User/slices")
    public String verSlices(){
        return "/UserPages/SlicesList";
    }
}

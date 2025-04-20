package org.example.proyectocloud.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/User")

public class UserController {

    @GetMapping("/User/slices")
    public String verSlices(){
        return "/UserPages/SlicesList";
    }
}

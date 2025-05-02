package org.example.proyectocloud.Controller.User;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/User")

public class UserController {

    @GetMapping("/slices")
    public String verSlices(){
        return "/UserPages/SlicesList";
    }

    @GetMapping("/sketch")
    public String verSketch(){
        return "/UserPages/Sketch";
    }

    @GetMapping({"/slice","/slice/","/slice/{sliceId}"})
    public String verSlice(@PathVariable("sliceId") String sliceId, Model model) {
        try {
            model.addAttribute("sliceId", sliceId);
            return "/UserPages/SliceView";
        } catch (Exception e) {
            model.addAttribute("error", "Error al cargar el Slice: " + e.getMessage());
            return "redirect:/User/sketch";
        }
    }
}

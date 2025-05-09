package org.example.proyectocloud.Controller.User;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/User/sketch")
public class UserSketchController {

    @GetMapping({"/", ""})
    public String inicial(){
        return "redirect:/User/sketch/list";
    }

    @GetMapping("/list")
    public String verSketchs(){
        return "UserPages/SketchList";
    }

    @GetMapping("/creator")
    public String crearSketch(){
        return "UserPages/SketchCreator";
    }

    @GetMapping("/{sketchId}")
    public String verSketch(@PathVariable Integer sketchId, Model model) {
        model.addAttribute("sketchId", sketchId);
        return "UserPages/SketchView";
    }

    @GetMapping("/edit/{sketchId}")
    public String editarSketch(@PathVariable Integer sketchId, Model model) {
        model.addAttribute("sketchId", sketchId);
        return "UserPages/SketchEditor";
    }
}

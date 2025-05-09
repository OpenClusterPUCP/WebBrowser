package org.example.proyectocloud.Controller.User;

import jakarta.servlet.http.HttpSession;
import org.apache.catalina.User;
import org.example.proyectocloud.Bean.UserInfo;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/User/slice")
public class UserSliceController {

    private final HttpSession session;

    public UserSliceController(HttpSession session) {
        this.session = session;
    }

    @GetMapping({"/", ""})
    public String inicial(){
        return "redirect:/User/slice/list";
    }

    @GetMapping("/list")
    public String verSlices(){
        System.out.println("UserInfo: "+ ((UserInfo) session.getAttribute("userInfo")).toString());
        return "UserPages/SliceList";
    }

    @GetMapping({"/{sliceId}"})
    public String verSlice(@PathVariable("sliceId") String sliceId, Model model) {
        try {
            model.addAttribute("sliceId", sliceId);
            return "UserPages/SliceView";
        } catch (Exception e) {
            model.addAttribute("error", "Error al cargar el Slice: " + e.getMessage());
            return "redirect:/User/slice/list";
        }
    }
}

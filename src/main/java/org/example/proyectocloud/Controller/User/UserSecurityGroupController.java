package org.example.proyectocloud.Controller.User;

import jakarta.servlet.http.HttpSession;
import org.example.proyectocloud.Bean.UserInfo;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/User/securityGroup")
public class UserSecurityGroupController {

    private final HttpSession session;

    public UserSecurityGroupController(HttpSession session) {
        this.session = session;
    }

    @GetMapping({"/", ""})
    public String inicial(){
        return "redirect:/User/securityGroup/list";
    }

    @GetMapping("/list")
    public String verSecurityGroups(){
        System.out.println("UserInfo: "+ ((UserInfo) session.getAttribute("userInfo")).toString());
        return "UserPages/SecurityGroupList";
    }

    @GetMapping({"/{securityGroupId}"})
    public String verSlice(@PathVariable("securityGroupId") String securityGroupId, Model model) {
        try {
            model.addAttribute("securityGroupId", securityGroupId);
            return "UserPages/RuleList";
        } catch (Exception e) {
            model.addAttribute("error", "Error al cargar el Security Group: " + e.getMessage());
            return "redirect:/User/securityGroup/list";
        }
    }
}

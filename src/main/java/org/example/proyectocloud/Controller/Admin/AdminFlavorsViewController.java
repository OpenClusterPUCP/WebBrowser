package org.example.proyectocloud.Controller.Admin;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.DTO.Admin.Flavors.FlavorRequest;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.example.proyectocloud.Service.Admin.AdminUsersService;
import org.example.proyectocloud.Service.Admin.FlavorService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/Admin")
@Slf4j
public class AdminFlavorsViewController {

    @GetMapping("/flavors")
    public String verFlavors(Model model){
        log.info("Accediendo a gestión de slices");
        model.addAttribute("activeMenu", "flavors");
        return "AdminPages/FlavorsList";
    }




}

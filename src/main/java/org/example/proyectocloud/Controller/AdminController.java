package org.example.proyectocloud.Controller;

import jakarta.servlet.http.HttpSession;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.DTO.Admin.Users.UserDTO;
import org.example.proyectocloud.Service.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Controller
@RequestMapping("/Admin")
public class AdminController {

    @Autowired
    private UsersService usersService;

    @GetMapping("/slices")
    public String verSlices(){
        return "/AdminPages/SlicesList";
    }


    @GetMapping("/users")
    public String verUsuarios(Model model, HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        List<UserDTO> usersData = usersService.consumirApiProtegidaAdmin(userInfo.getJwt());
        model.addAttribute("usersData", usersData);

        model.addAttribute("activeMenu", "users");

        return "/AdminPages/UsersList";
    }

    // Endpoint REST para crear usuario
    @PostMapping("/api/users/create")
    @ResponseBody
    public ResponseEntity<?> createUser(@RequestBody UserDTO userDTO, HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        if (userInfo == null || userInfo.getJwt() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "No hay sesión activa"));
        }

        try {
            // Llamar al servicio para crear usuario
            Object result = usersService.createUser(userDTO, userInfo.getJwt());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al crear usuario: " + e.getMessage()));
        }
    }




    //Si quieres crear apis  usa  /api/"Lo q quieras"
}

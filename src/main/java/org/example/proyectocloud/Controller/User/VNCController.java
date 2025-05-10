package org.example.proyectocloud.Controller.User;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.example.proyectocloud.Bean.UserInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

@Controller
@RequestMapping("/VNC")
public class VNCController {

    private static final Logger logger = LoggerFactory.getLogger(VNCController.class);
    private final HttpSession session;

    public VNCController(HttpSession session) {
        this.session = session;
    }

    @GetMapping({"/", ""})
    public String inicial(){
        return "redirect:/User/slice/list";
    }

    @GetMapping("/vm/{vmId}")
    public String getVNCConsole(
            @PathVariable Integer vmId,
            @RequestParam(required = true) String token,
            Model model) {

        logger.info("=== VNC CONSOLE VM ID-{} ===", vmId);
        logger.debug("Token recibido: {}", token);

        try {
            if (token == null || token.isEmpty()) {
                logger.warn("No se proporcionó un token para VM ID-{}", vmId);
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "El token de acceso es requerido");
            }

            model.addAttribute("vmId", vmId);
            model.addAttribute("token", token);

            logger.info("Renderizando cliente VNC para VM ID-{}", vmId);
            return "vnc";

        } catch (Exception e) {
            logger.error("Error accediendo a VNC: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error al acceder a la consola VNC: " + e.getMessage());
        }
    }

}

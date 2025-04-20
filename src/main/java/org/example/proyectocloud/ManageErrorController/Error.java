package org.example.proyectocloud.ManageErrorController;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class Error implements org.springframework.boot.web.servlet.error.ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request){
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        if (status != null) {
            int statusCode = Integer.parseInt(status.toString());
            // Imprimir en consola el código de error
            System.out.println("Código de error HTTP: " + statusCode);
            // Puedes manejar diferentes códigos de error
            if (statusCode == 404) {
                System.out.println("Página no encontrada (404)");
                return "ErrorPages/error-404";
            } else if (statusCode == 500) {
                System.out.println("Error interno del servidor (500)");
                return "ErrorPages/error-500";
            }else if(statusCode == 403){
                return "ErrorPages/error-403";
            }
        }
        return "ErrorPages/error-404";
    }
}
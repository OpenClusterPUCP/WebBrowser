package org.example.proyectocloud.Controller.Admin.Api;

import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.example.proyectocloud.Service.Admin.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.example.proyectocloud.Bean.ImageRequest;

import jakarta.servlet.http.HttpSession;

import javax.print.attribute.standard.Media;
import java.util.Map;
import java.util.Optional;

@RestController
@Slf4j
@RequestMapping("/Admin")
public class AdminImagesApiController {
    @Autowired
    private ImageService imageService;
    // Constante para la clave del token en la sesión
    private static final String SESSION_TOKEN_KEY = "userInfo";
    private static final String SESSION_USER_ID_KEY = "userInfo";

    /**
     * Método auxiliar para obtener el token de la sesión
     */
    private String getTokenFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_TOKEN_KEY);
        if (userInfo.getJwt() == null) {
            log.warn("No se encontró token en la sesión");
            // Podrías lanzar una excepción aquí o manejar de otra forma
        }
        return userInfo.getJwt();
    }

    /**
     * Método auxiliar para obtener el ID del usuario de la sesión
     */
    private Integer getUserIdFromSession(HttpSession session) {
        Integer userId = ((UserInfo) session.getAttribute(SESSION_USER_ID_KEY)).getId();
        if (userId == null) {
            log.warn("No se encontró ID de usuario en la sesión");
            // Podrías lanzar una excepción aquí o manejar de otra forma
        }
        return userId;
    }
    /**
     * Endpoint para listar todas las imágenes de un usuario
     */
    @GetMapping("/list/{userId}")
    public ResponseEntity<?> listUserImages(
            @PathVariable Integer userId,
            HttpSession session) {

        log.info("Request to list images for user ID: {}", userId);

        // Obtener el token de autenticación de la sesión
        String token = getTokenFromSession(session);
        if (token == null) {
            log.error("Authentication token not found in session");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        // Llamar al servicio para obtener las imágenes
        Object result = imageService.getUserImages(token, userId);

        return ResponseEntity.ok(result);
    }

    /**
     * Endpoint para crear una nueva imagen
     */
    @PostMapping(value = "/create")
    @ResponseBody
    public ResponseEntity<?> createImage(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "userId", required = false) Integer userId,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            HttpSession session) {

        log.info("Request to create image with name: {}, type: {}", name, type);

        // Obtener el token de autenticación de la sesión
        String token = getTokenFromSession(session);
        if (token == null) {
            log.error("Authentication token not found in session");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        // Crear el objeto ImageRequest con los datos proporcionados
        ImageRequest imageRequest = new ImageRequest();
        imageRequest.setName(name);
        imageRequest.setType(type);
        if(type.equals("private")){
            imageRequest.setUserId(userId);
        }

        // Llamar al servicio para crear la imagen
        Object result = imageService.createImage(token, imageRequest, imageFile);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    /**
     * Endpoint para eliminar una imagen
     */
    @DeleteMapping("/delete/{imageId}")
    public ResponseEntity<?> deleteImage(
            @PathVariable Integer imageId,
            HttpSession session) {

        log.info("Request to delete image with ID: {}", imageId);

        // Obtener el token de autenticación de la sesión
        String token = getTokenFromSession(session);
        if (token == null) {
            log.error("Authentication token not found in session");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        // Llamar al servicio para eliminar la imagen
        Object result = imageService.deleteImage(token, imageId);

        return ResponseEntity.ok(result);
    }

    /**
     * Endpoint para actualizar una imagen existente
     */
    @PostMapping(value = "/update/{imageId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateImage(
            @PathVariable Integer imageId,
            @RequestPart("name") String name,
            @RequestPart("type") String type,
            @RequestPart(value = "userId", required = false) Integer userId,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile,
            @RequestPart("adminId") Integer adminId,
            HttpSession session) {

        log.info("Request to update image with ID: {}", imageId);

        // Obtener el token de autenticación de la sesión
        String token = getTokenFromSession(session);
        if (token == null) {
            log.error("Authentication token not found in session");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        // Crear el objeto ImageRequest con los datos proporcionados
        ImageRequest imageRequest = new ImageRequest();
        imageRequest.setName(name);
        imageRequest.setType(type);
        imageRequest.setUserId(userId);

        // Llamar al servicio para actualizar la imagen
        Object result = imageService.updateImage(token, imageId, imageRequest, imageFile, adminId);

        return ResponseEntity.ok(result);
    }

    /**
     * Endpoint para manejar las imágenes en el panel de administración
     * Este método renderiza la vista de administración de imágenes
     */
    @GetMapping("/management")
    public String showImageManagement(HttpSession session) {
        // Verificar si el usuario está autenticado
        if (session.getAttribute("authToken") == null) {
            log.warn("Unauthorized access attempt to image management page");
            return "redirect:/login";
        }

        log.info("Rendering image management page");
        return "admin/images/management";  // Nombre de tu plantilla de vista
    }

    /**
     * Endpoint para mostrar el formulario de creación de imágenes
     */
    @GetMapping("/create-form")
    public String showCreateImageForm(HttpSession session) {
        // Verificar si el usuario está autenticado
        if (session.getAttribute("authToken") == null) {
            log.warn("Unauthorized access attempt to create image form");
            return "redirect:/login";
        }

        log.info("Rendering create image form");
        return "admin/images/create-form";  // Nombre de tu plantilla de vista
    }

    /**
     * Endpoint para mostrar el formulario de edición de imágenes
     */
    @GetMapping("/edit-form/{imageId}")
    public String showEditImageForm(
            @PathVariable Integer imageId,
            HttpSession session) {
        // Verificar si el usuario está autenticado
        if (session.getAttribute("authToken") == null) {
            log.warn("Unauthorized access attempt to edit image form");
            return "redirect:/login";
        }

        log.info("Rendering edit form for image ID: {}", imageId);
        return "admin/images/edit-form";  // Nombre de tu plantilla de vista
    }

    /**
     * Método auxiliar para manejar errores
     */
    private ResponseEntity<?> handleError(String message) {
        log.error(message);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", message));
    }
}

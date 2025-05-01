package org.example.proyectocloud.Controller.Admin.Api;

import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
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
import java.util.*;

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
            @RequestParam(value = "disco", required = false) String disco,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "userId", required = false) Integer userId,
            @RequestParam(value = "size", required = false) Integer imageSize,
            @RequestParam(value = "so", required = false) String os,
            @RequestParam(value = "version", required = false) String version,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            HttpSession session) {

        log.info("Request to create image with name: {}, type: {}", name, type);

        try {
            // 1. Input validation
            Map<String, String> errors = new HashMap<>();

            // Validate required fields
            if (StringUtils.isEmpty(name)) {
                errors.put("name", "El nombre de la imagen es obligatorio");
            } else if (!name.matches("^[a-zA-Z0-9\\-\\.\\s]+$")) {
                errors.put("name", "El nombre solo puede contener letras, números, guiones, puntos y espacios");
            }

            if (StringUtils.isEmpty(type)) {
                errors.put("type", "El tipo de imagen es obligatorio");
            }

            if (StringUtils.isEmpty(os)) {
                errors.put("os", "El sistema operativo es obligatorio");
            }

            if (StringUtils.isEmpty(version)) {
                errors.put("version", "La versión del sistema operativo es obligatoria");
            }

            if (imageSize == null || imageSize < 1) {
                errors.put("size", "El tamaño del disco debe ser al menos 1GB");
            }

            if (StringUtils.isEmpty(disco)) {
                errors.put("disco", "El tamaño del disco es obligatorio");
            }

            // Special validations
            if ("private".equals(type) && userId == null) {
                errors.put("userId", "El ID de usuario es obligatorio para imágenes privadas");
            }

            // Validate file if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                // Check file size (2GB max)
                long maxSize = 2L * 1024 * 1024 * 1024;
                if (imageFile.getSize() > maxSize) {
                    errors.put("imageFile", "El archivo no debe superar los 2GB");
                }

                // Check file extension
                String filename = imageFile.getOriginalFilename();
                if (filename != null) {
                    String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
                    List<String> allowedExtensions = Arrays.asList("iso", "img", "qcow2", "vdi", "vmdk", "vhd", "vhdx", "ova");
                    if (!allowedExtensions.contains(extension)) {
                        errors.put("imageFile", "Formato de archivo no válido. Formatos permitidos: ISO, IMG, QCOW2, VDI, VMDK, VHD, VHDX, OVA");
                    }
                }
            }

            // Return validation errors if any
            if (!errors.isEmpty()) {
                log.warn("Validation errors in create image request: {}", errors);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .header("X-Error-Type", "ValidationError")
                        .header("X-Error-Code", "VALIDATION_ERROR")
                        .body(Map.of(
                                "status", HttpStatus.BAD_REQUEST.value(),
                                "message", "Error de validación",
                                "errors", errors));
            }

            // 2. Check authentication token
            String token = getTokenFromSession(session);
            if (token == null) {
                log.error("Authentication token not found in session");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .header("X-Error-Type", "AuthError")
                        .header("X-Error-Code", "MISSING_TOKEN")
                        .body(Map.of(
                                "status", HttpStatus.UNAUTHORIZED.value(),
                                "message", "Se requiere autenticación"));
            }

            // 3. Create the ImageRequest object
            ImageRequest imageRequest = new ImageRequest();
            imageRequest.setName(name);
            imageRequest.setType(type);
            imageRequest.setDisco(disco != null ? disco.replace(" GB", "") : null);
            imageRequest.setDescription(description);
            imageRequest.setOs(os);
            imageRequest.setImageSize(imageSize);
            imageRequest.setVersion(version);

            if ("private".equals(type) && userId != null) {
                imageRequest.setUserId(userId);
            }

            log.debug("Created image request: {}", imageRequest);

            // 4. Call service and handle specific exceptions
            try {
                Object result = imageService.createImage(token, imageRequest, imageFile);
                log.info("Image created successfully: {}", result);

                return ResponseEntity.status(HttpStatus.CREATED)
                        .header("X-Success-Code", "IMAGE_CREATED")
                        .body(Map.of(
                                "status", HttpStatus.CREATED.value(),
                                "message", "Imagen creada exitosamente",
                                "content", result));

            } catch (Exception e) {
                // Handle different types of exceptions with specific error messages
                HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
                String errorType = "SystemError";
                String errorCode = "UNKNOWN_ERROR";
                String message = "Error inesperado: " + e.getMessage();

                // Determine specific error type from exception
                if (e.getMessage() != null) {
                    String errorMsg = e.getMessage().toLowerCase();

                    if (errorMsg.contains("already exists") || errorMsg.contains("ya existe")) {
                        status = HttpStatus.CONFLICT;
                        errorType = "ResourceError";
                        errorCode = "IMAGE_ALREADY_EXISTS";
                        message = "Ya existe una imagen con el mismo nombre";
                    }
                    else if (errorMsg.contains("storage") || errorMsg.contains("file") ||
                            errorMsg.contains("almacenamiento") || errorMsg.contains("archivo")) {
                        status = HttpStatus.INTERNAL_SERVER_ERROR;
                        errorType = "StorageError";
                        errorCode = "FILE_STORAGE_ERROR";
                        message = "Error al almacenar el archivo de imagen";
                    }
                    else if (errorMsg.contains("token") || errorMsg.contains("expired") ||
                            errorMsg.contains("expirado")) {
                        status = HttpStatus.UNAUTHORIZED;
                        errorType = "AuthError";
                        errorCode = "TOKEN_EXPIRED";
                        message = "El token de autenticación ha expirado";
                    }
                    else if (errorMsg.contains("permission") || errorMsg.contains("permiso") ||
                            errorMsg.contains("unauthorized") || errorMsg.contains("no autorizado")) {
                        status = HttpStatus.FORBIDDEN;
                        errorType = "AuthError";
                        errorCode = "FORBIDDEN_ACCESS";
                        message = "No tiene permisos para crear esta imagen";
                    }
                }

                log.error("Error creating image: {}", message, e);
                return ResponseEntity.status(status)
                        .header("X-Error-Type", errorType)
                        .header("X-Error-Code", errorCode)
                        .body(Map.of(
                                "status", status.value(),
                                "message", message));
            }
        } catch (Exception e) {
            // Final catch-all for unexpected errors
            log.error("Unexpected error creating image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("X-Error-Type", "SystemError")
                    .header("X-Error-Code", "UNEXPECTED_ERROR")
                    .body(Map.of(
                            "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                            "message", "Error inesperado en el servidor: " + e.getMessage()));
        }
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
    @PostMapping(value = "/update/{imageId}")
    public ResponseEntity<?> updateImage(
            @PathVariable(value= "imageId") Integer imageId,
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam("adminId") Integer adminId,
            HttpSession session) {

        log.info("Request to update image with ID: {}, name: {}, description: {}, state: {}",
                imageId, name, description, state);

        // Obtener el token de autenticación de la sesión
        String token = getTokenFromSession(session);
        if (token == null) {
            log.error("Authentication token not found in session");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        try {
            // Llamar al servicio con los parámetros individuales
            Object result = imageService.updateImage(token, imageId, name, description, state, adminId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error updating image: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error updating image: " + e.getMessage()));
        }
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

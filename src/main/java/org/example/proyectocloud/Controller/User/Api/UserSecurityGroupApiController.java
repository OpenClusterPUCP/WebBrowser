package org.example.proyectocloud.Controller.User.Api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.Service.User.SecurityGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("User/api/securityGroup")
@Slf4j
public class UserSecurityGroupApiController {

    @Autowired
    private SecurityGroupService securityGroupService;

    private static final String SESSION_TOKEN_KEY = "userInfo";
    private static final String SESSION_USER_ID_KEY = "userInfo";

    private String getTokenFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_TOKEN_KEY);
        if (userInfo == null || userInfo.getJwt() == null) {
            log.warn("No se encontró token en la sesión");
            return null;
        }
        log.info("Token recuperado de la sesión: {}", userInfo.getJwt());
        return userInfo.getJwt();
    }

    private Integer getUserIdFromSession(HttpSession session) {
        UserInfo userInfo = (UserInfo) session.getAttribute(SESSION_USER_ID_KEY);
        if (userInfo == null || userInfo.getId() == null) {
            log.warn("No se encontró ID de usuario en la sesión");
            return null;
        }
        return userInfo.getId();
    }

    @GetMapping("/list-security-groups")
    @ResponseBody
    public ResponseEntity<?> listSecurityGroups(HttpSession session) {
        log.info("Recibida petición para listar security groups");
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.listSecurityGroups(token);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al listar security groups");
        }
    }

    @PostMapping("/create-security-group")
    @ResponseBody
    public ResponseEntity<?> createSecurityGroup(@RequestBody Map<String, Object> body, HttpSession session) {
        log.info("Recibida petición para crear security group");
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.createSecurityGroup(token, body);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al crear security group");
        }
    }

    @GetMapping("/get-security-group/{sgId}")
    @ResponseBody
    public ResponseEntity<?> getSecurityGroup(@PathVariable Integer sgId, HttpSession session) {
        log.info("Recibida petición para obtener security group: {}", sgId);
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.getSecurityGroup(token, sgId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al obtener security group");
        }
    }

    @PutMapping("/edit-security-group")
    @ResponseBody
    public ResponseEntity<?> editSecurityGroup(@RequestBody Map<String, Object> body, HttpSession session) {
        log.info("Recibida petición para editar security group");
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.editSecurityGroup(token, body);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al editar security group");
        }
    }

    @DeleteMapping("/delete-security-group/{sgId}")
    @ResponseBody
    public ResponseEntity<?> deleteSecurityGroup(@PathVariable Integer sgId, HttpSession session) {
        log.info("Recibida petición para eliminar security group: {}", sgId);
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.deleteSecurityGroup(token, sgId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al eliminar security group");
        }
    }

    @PutMapping("/assign-security-group")
    @ResponseBody
    public ResponseEntity<?> assignSecurityGroup(@RequestBody Map<String, Object> body, HttpSession session) {
        log.info("Recibida petición para asignar security group");
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.assignSecurityGroup(token, body);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al asignar security group");
        }
    }

    @PutMapping("/unassign-security-group")
    @ResponseBody
    public ResponseEntity<?> unassignSecurityGroup(@RequestBody Map<String, Object> body, HttpSession session) {
        log.info("Recibida petición para desasignar security group");
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.unassignSecurityGroup(token, body);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al desasignar security group");
        }
    }

    @GetMapping("/get-security-group-by-interface/{interfaceId}")
    @ResponseBody
    public ResponseEntity<?> getSecurityGroupByInterface(@PathVariable Integer interfaceId, HttpSession session) {
        log.info("Recibida petición para obtener SG por interfaz: {}", interfaceId);
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.getSecurityGroupByInterface(token, interfaceId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al obtener SG por interfaz");
        }
    }

    @PostMapping("/create-rule")
    @ResponseBody
    public ResponseEntity<?> createRule(@RequestBody Map<String, Object> body, HttpSession session) {
        log.info("Recibida petición para crear regla");
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.createRule(token, body);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al crear regla");
        }
    }

    @DeleteMapping("/delete-rule/{ruleId}")
    @ResponseBody
    public ResponseEntity<?> deleteRule(@PathVariable Integer ruleId, HttpSession session) {
        log.info("Recibida petición para eliminar regla: {}", ruleId);
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.deleteRule(token, ruleId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al eliminar regla");
        }
    }

    @GetMapping("/list-rules/{sgId}")
    @ResponseBody
    public ResponseEntity<?> listRules(@PathVariable Integer sgId, HttpSession session) {
        log.info("Recibida petición para listar reglas de SG: {}", sgId);
        try {
            String token = getTokenFromSession(session);
            if (token == null) {
                return unauthorizedResponse();
            }
            Object result = securityGroupService.listRules(token, sgId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return handleException(e, "Error al listar reglas");
        }
    }

    private ResponseEntity<?> unauthorizedResponse() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", "error", "message", "Sesión no válida"));
    }

    private ResponseEntity<?> handleException(Exception e, String errorPrefix) {
        log.error(errorPrefix + ": {}", e.getMessage());
        String errorMessage = e.getMessage();
        if (errorMessage != null && errorMessage.contains("{")) {
            try {
                String jsonPart = errorMessage.substring(
                        errorMessage.indexOf("{"),
                        errorMessage.lastIndexOf("}") + 1
                );
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> errorResponse = mapper.readValue(
                        jsonPart,
                        new TypeReference<Map<String, Object>>() {}
                );
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(errorResponse);
            } catch (Exception jsonException) {
                log.error("Error parsing JSON error message: {}", jsonException.getMessage());
            }
        }
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "status", "error",
                        "message", errorMessage
                ));
    }
}
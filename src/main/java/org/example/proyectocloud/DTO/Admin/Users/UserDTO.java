package org.example.proyectocloud.DTO.Admin.Users;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private Integer id;
    private String username;
    private String name;
    private String lastname;
    private String code;
    private String role;
    private Integer roleId; // Para la creación
    private String state;
    private String password; // Para la creación
    private boolean generatePassword; // Para la creación


    // Constructor para datos existentes
    public UserDTO(Integer id, String username, String name, String lastname, String code, String role, String state) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.lastname = lastname;
        this.code = code;
        this.role = role;
        this.state = state;
    }

    // Método para obtener el nombre completo
    public String getFullName() {
        return name + " " + lastname;
    }
}
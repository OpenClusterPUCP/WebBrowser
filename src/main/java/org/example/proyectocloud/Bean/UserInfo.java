package org.example.proyectocloud.Bean;

import java.io.Serializable;

public class UserInfo implements Serializable {
    private Integer id;
    private String name;
    private String lastname;
    private String username;
    private String code;
    private String jwt;
    private String role;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getJwt() {
        return jwt;
    }

    public void setJwt(String jwt) {
        this.jwt = jwt;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getInitials(){
        return name.substring(0, 1).toUpperCase() + lastname.substring(0, 1).toUpperCase();
    }

    public String getFullName(){
        return name + " " + lastname;
    }

    public String getRoleBonito(){
        if(role.toLowerCase().contains("admin")){
            return "Administrador";
        }else if(role.toLowerCase().contains("user")){
            return "Usuario";
        }else{
            return "Desconocido";
        }
    }

    @Override
    public String toString() {
        return "UserInfo{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", lastname='" + lastname + '\'' +
                ", username='" + username + '\'' +
                ", code='" + code + '\'' +
                ", jwt='" + jwt + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}
